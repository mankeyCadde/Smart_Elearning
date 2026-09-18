from decimal import Decimal

from django.db.models import Count, Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdmin, IsInstructor

from notifications.services import notify

from .models import (
    AnswerOption,
    Assignment,
    AssignmentSubmission,
    Question,
    Quiz,
    Submission,
    SubmissionAnswer,
)
from .serializers import (
    AssignmentCreateUpdateSerializer,
    AssignmentGradeSerializer,
    AssignmentListSerializer,
    AssignmentSubmissionSerializer,
    AssignmentSubmitSerializer,
    InstructorSubmissionSerializer,
    QuizDetailSerializer,
    QuizListSerializer,
    QuizStudentDetailSerializer,
    QuizStudentListSerializer,
    QuizSubmitSerializer,
    QuizWriteSerializer,
    SubmissionDetailSerializer,
    SubmissionGradeSerializer,
    SubmissionListSerializer,
)

TWO_PLACES = Decimal("0.01")


def _time_limit_expired(submission):
    quiz = submission.quiz
    if not quiz.timeLimitMinutes:
        return False
    elapsed = timezone.now() - submission.startedAt
    return elapsed.days > 0 or elapsed.seconds > quiz.timeLimitMinutes * 60


def _enrolled_quiz_qs(user):
    """Quizzes of courses the student is enrolled in, published and not past due."""
    return (
        Quiz.objects.filter(
            course__enrollments__student=user, published=True
        )
        .filter(Q(dueDate__isnull=True) | Q(dueDate__gte=timezone.now()))
        .annotate(
            _questions_count=Count("questions", distinct=True),
            _attempts_used=Count(
                "submissions",
                filter=Q(submissions__student=user),
                distinct=True,
            ),
            _best_score=Max(
                "submissions__score",
                filter=Q(submissions__student=user),
            ),
        )
        .select_related("course")
    )


def _get_enrolled_and_published_quiz(user, pk):
    quiz = _enrolled_quiz_qs(user).filter(pk=pk).first()
    if not quiz:
        raise PermissionDenied(
            "You are not enrolled in this course or the quiz is unavailable."
        )
    quiz._in_progress_submissions = list(
        Submission.objects.filter(
            student=user, quiz=quiz, status=Submission.Status.IN_PROGRESS
        )
    )
    return quiz


def _grade_submission(submission, answers):
    """Auto-grade MC/TF answers; leave SA answers for manual grading."""
    quiz = submission.quiz
    questions = {q.id: q for q in quiz.questions.all()}
    if not questions:
        raise ValidationError({"detail": "This quiz has no questions."})

    by_question = {a["questionId"]: a for a in answers}
    unknown = set(by_question) - set(questions)
    if unknown:
        raise ValidationError(
            {"detail": f"Unknown question ids: {sorted(unknown)}"}
        )

    total_possible = sum(q.points for q in questions.values())
    if total_possible <= 0:
        raise ValidationError({"detail": "Quiz questions have no points."})

    awarded = Decimal("0")
    for question_id, question in questions.items():
        item = by_question.get(question_id)
        if question.questionType == Question.Type.SHORT_ANSWER:
            SubmissionAnswer.objects.update_or_create(
                submission=submission,
                question=question,
                defaults={
                    "selectedOption": None,
                    "textAnswer": (item or {}).get("textAnswer", "") or "",
                    "isCorrect": None,
                    "pointsAwarded": Decimal("0"),
                },
            )
            continue

        option = None
        if item and item.get("optionId"):
            option = AnswerOption.objects.filter(
                pk=item["optionId"], question=question
            ).first()
        if not option:
            raise ValidationError(
                {
                    "detail": f"Question {question_id} requires a valid optionId."
                }
            )
        is_correct = option.isCorrect
        points_awarded = (
            Decimal(question.points) if is_correct else Decimal("0")
        )
        awarded += points_awarded
        SubmissionAnswer.objects.update_or_create(
            submission=submission,
            question=question,
            defaults={
                "selectedOption": option,
                "textAnswer": "",
                "isCorrect": is_correct,
                "pointsAwarded": points_awarded,
            },
        )

    score = (awarded / total_possible * Decimal("100")).quantize(TWO_PLACES)
    submission.score = score
    submission.completedAt = timezone.now()
    ungraded = (
        submission.answers.filter(
            question__questionType=Question.Type.SHORT_ANSWER,
            isCorrect__isnull=True,
        ).exists()
    )
    submission.status = (
        Submission.Status.COMPLETED
        if ungraded
        else Submission.Status.GRADED
    )
    submission.save(update_fields=["score", "completedAt", "status"])
    return submission


def _recompute_score(submission):
    total_possible = sum(
        q.points for q in submission.quiz.questions.all()
    ) or 1
    awarded = sum(
        a.pointsAwarded for a in submission.answers.all()
    )
    submission.score = (awarded / total_possible * Decimal("100")).quantize(
        TWO_PLACES
    )
    ungraded = submission.answers.filter(
        question__questionType=Question.Type.SHORT_ANSWER,
        isCorrect__isnull=True,
    ).exists()
    submission.status = (
        Submission.Status.COMPLETED
        if ungraded
        else Submission.Status.GRADED
    )
    submission.save(update_fields=["score", "status"])
    return submission


# ── Student-facing ────────────────────────────────────────────────────────────


class QuizListView(APIView):
    """GET: quizzes available to the authenticated student."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        quizzes = _enrolled_quiz_qs(request.user)
        return Response(
            QuizStudentListSerializer(quizzes, many=True).data
        )


class QuizDetailView(APIView):
    """GET: quiz with questions (correct answers hidden) for enrolled student."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        quiz = _get_enrolled_and_published_quiz(request.user, pk)
        quiz = (
            Quiz.objects.filter(pk=quiz.pk)
            .select_related("course")
            .prefetch_related("questions__options")
            .first()
        )
        quiz._in_progress_submissions = list(
            Submission.objects.filter(
                student=request.user,
                quiz=quiz,
                status=Submission.Status.IN_PROGRESS,
            )
        )
        return Response(
            QuizStudentDetailSerializer(quiz, context={"request": request}).data
        )


class QuizStartView(APIView):
    """POST: begin a new attempt for the authenticated student."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        quiz = _get_enrolled_and_published_quiz(request.user, pk)
        if quiz.dueDate and quiz.dueDate < timezone.now():
            raise ValidationError({"detail": "This quiz is past its due date."})
        if not quiz.questions.exists():
            raise ValidationError({"detail": "This quiz has no questions."})

        used = Submission.objects.filter(
            student=request.user, quiz=quiz
        ).count()
        in_progress = (
            Submission.objects.filter(
                student=request.user,
                quiz=quiz,
                status=Submission.Status.IN_PROGRESS,
            )
            .select_related("quiz")
            .first()
        )
        if in_progress:
            return Response(
                SubmissionListSerializer(in_progress).data,
            )
        if used >= quiz.maxAttempts:
            raise ValidationError(
                {"detail": "You have used all attempts for this quiz."}
            )
        submission = Submission.objects.create(
            student=request.user,
            quiz=quiz,
            attemptNumber=used + 1,
        )
        return Response(
            SubmissionListSerializer(submission).data,
            status=201,
        )


class QuizSubmitView(APIView):
    """POST {answers: [...]}: grade and finalize the student's in-progress attempt."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        quiz = get_object_or_404(
            Quiz, pk=pk, published=True,
            course__enrollments__student=request.user,
        )
        submission = get_object_or_404(
            Submission,
            student=request.user,
            quiz=quiz,
            status=Submission.Status.IN_PROGRESS,
        )
        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _grade_submission(submission, serializer.validated_data["answers"])
        submission.refresh_from_db()
        if submission.status in (
            Submission.Status.COMPLETED,
            Submission.Status.GRADED,
        ):
            notify(
                request.user,
                "quiz",
                "Quiz submitted",
                f"Your attempt for '{quiz.title}' was graded. Score: {submission.score}%.",
                link=f"/course/{quiz.course_id}/quizzes",
            )
            from gamification.services import on_quiz_submit

            on_quiz_submit(request.user, submission.score)
        return Response(SubmissionDetailSerializer(submission).data)


class MySubmissionsView(APIView):
    """GET: the authenticated student's quiz submissions."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        submissions = (
            Submission.objects.filter(student=request.user)
            .select_related("quiz", "quiz__course")
            .annotate(_answers_count=Count("answers", distinct=True))
        )
        return Response(
            SubmissionListSerializer(submissions, many=True).data
        )


class SubmissionDetailView(APIView):
    """GET: the student's own submission with answer-by-answer results."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        submission = get_object_or_404(
            Submission.objects.select_related("quiz", "quiz__course"),
            pk=pk,
            student=request.user,
        )
        return Response(SubmissionDetailSerializer(submission).data)


# ── Instructor-facing ─────────────────────────────────────────────────────────


class InstructorQuizListView(APIView):
    """GET list / POST create quizzes for the instructor's own courses."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request):
        qs = Quiz.objects.all() if request.user.is_admin else Quiz.objects.filter(
            course__instructor=request.user
        )
        qs = qs.annotate(
            _questions_count=Count("questions", distinct=True),
            _submissions_count=Count("submissions", distinct=True),
        ).select_related("course")
        return Response(QuizListSerializer(qs, many=True).data)

    def post(self, request):
        serializer = QuizWriteSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        return Response(
            QuizListSerializer(
                Quiz.objects.annotate(
                    _questions_count=Count("questions", distinct=True),
                    _submissions_count=Count("submissions", distinct=True),
                ).get(pk=quiz.pk)
            ).data,
            status=201,
        )


class InstructorQuizDetailView(APIView):
    """GET/PUT/PATCH/DELETE a single quiz (own courses, or any for admin)."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def _get_quiz(self, request, pk):
        if request.user.is_admin:
            return get_object_or_404(Quiz, pk=pk)
        return get_object_or_404(
            Quiz, pk=pk, course__instructor=request.user
        )

    def get(self, request, pk):
        quiz = self._get_quiz(request, pk)
        quiz = (
            Quiz.objects.filter(pk=quiz.pk)
            .select_related("course")
            .prefetch_related("questions__options")
            .annotate(
                _questions_count=Count("questions", distinct=True),
                _submissions_count=Count("submissions", distinct=True),
            )
            .first()
        )
        return Response(QuizDetailSerializer(quiz).data)

    def _save(self, request, pk, partial):
        quiz = self._get_quiz(request, pk)
        serializer = QuizWriteSerializer(
            quiz,
            data=request.data,
            partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        quiz = (
            Quiz.objects.filter(pk=quiz.pk)
            .select_related("course")
            .prefetch_related("questions__options")
            .annotate(
                _questions_count=Count("questions", distinct=True),
                _submissions_count=Count("submissions", distinct=True),
            )
            .first()
        )
        return Response(QuizDetailSerializer(quiz).data)

    def put(self, request, pk):
        return self._save(request, pk, partial=False)

    def patch(self, request, pk):
        return self._save(request, pk, partial=True)

    def delete(self, request, pk):
        quiz = self._get_quiz(request, pk)
        quiz.delete()
        return Response(status=204)


class InstructorQuizSubmissionsView(APIView):
    """GET: list submissions for an instructor's quiz."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request, pk):
        if request.user.is_admin:
            quiz = get_object_or_404(Quiz, pk=pk)
        else:
            quiz = get_object_or_404(
                Quiz, pk=pk, course__instructor=request.user
            )
        submissions = (
            Submission.objects.filter(quiz=quiz)
            .select_related("student", "quiz", "quiz__course")
            .prefetch_related("answers__question")
        )
        return Response(
            InstructorSubmissionSerializer(submissions, many=True).data
        )


class InstructorSubmissionGradeView(APIView):
    """POST {answers: [{answerId, points}]}: manually grade short answers."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def post(self, request, pk):
        submission = get_object_or_404(
            Submission.objects.select_related("quiz", "quiz__course"),
            pk=pk,
        )
        if not request.user.is_admin and (
            submission.quiz.course.instructor_id != request.user.id
        ):
            raise PermissionDenied("You do not own this quiz.")

        serializer = SubmissionGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for item in serializer.validated_data["answers"]:
            answer_id = item.get("answerId")
            points = Decimal(str(item.get("points") or 0))
            answer = submission.answers.filter(
                pk=answer_id,
                question__questionType=Question.Type.SHORT_ANSWER,
            ).first()
            if not answer:
                raise ValidationError(
                    {"detail": f"Invalid short-answer id {answer_id}."}
                )
            answer.pointsAwarded = points
            answer.isCorrect = points > 0
            answer.save(update_fields=["pointsAwarded", "isCorrect"])

        _recompute_score(submission)
        submission = Submission.objects.select_related(
            "student", "quiz", "quiz__course"
        ).get(pk=submission.pk)
        notify(
            submission.student,
            "quiz",
            "Quiz results updated",
            f"Your short answers in '{submission.quiz.title}' were graded. "
            f"New score: {submission.score}%.",
            link=f"/course/{submission.quiz.course_id}/quizzes",
        )
        return Response(InstructorSubmissionSerializer(submission).data)


# ── Assignments ───────────────────────────────────────────────────────────────


class AssignmentListView(APIView):
    """Student: list published assignments in my enrolled courses."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        assignments = (
            Assignment.objects.filter(
                published=True,
                course__enrollments__student=user,
            )
            .select_related("course", "course__instructor")
            .annotate(_submissions_count=Count("submissions"))
            .distinct()
            .order_by("-createdAt")
        )
        my_submissions = {
            s.assignment_id: s
            for s in AssignmentSubmission.objects.filter(
                assignment__course__enrollments__student=user,
                student=user,
            ).select_related("assignment")
        }
        for assignment in assignments:
            assignment._my_submission = my_submissions.get(assignment.id)
        return Response(
            AssignmentListSerializer(assignments, many=True).data
        )


class AssignmentDetailView(APIView):
    """Student: assignment detail + submit/resubmit (multipart or JSON)."""

    permission_classes = [IsAuthenticated]

    def _get_assignment(self, pk, user):
        assignment = get_object_or_404(
            Assignment.objects.select_related("course", "course__instructor"),
            pk=pk,
            published=True,
        )
        if not user.is_admin and not (
            assignment.course.enrollments.filter(
                student=user, status="ACCEPTED"
            ).exists()
        ) and not (
            user.is_instructor
            and assignment.course.instructor_id == user.id
        ):
            raise PermissionDenied(
                "You must be enrolled in this course."
            )
        return assignment

    def get(self, request, pk):
        user = request.user
        assignment = self._get_assignment(pk, user)
        my_submission = AssignmentSubmission.objects.filter(
            assignment=assignment, student=user
        ).first()
        assignment._my_submission = my_submission
        assignment._submissions_count = assignment.submissions.count()
        data = AssignmentListSerializer(assignment).data
        data["enrolled"] = assignment.course.enrollments.filter(
            student=user, status="ACCEPTED"
        ).exists()
        return Response(data)

    def post(self, request, pk):
        user = request.user
        assignment = self._get_assignment(pk, user)
        if not user.is_admin and not assignment.course.enrollments.filter(
            student=user, status="ACCEPTED"
        ).exists():
            raise PermissionDenied(
                "You must be enrolled in this course."
            )
        serializer = AssignmentSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submission, created = AssignmentSubmission.objects.get_or_create(
            assignment=assignment,
            student=user,
            defaults={
                "content": serializer.validated_data.get("content", ""),
                "file": serializer.validated_data.get("file"),
            },
        )
        if not created:
            submission.content = serializer.validated_data.get(
                "content", submission.content
            )
            if "file" in serializer.validated_data:
                submission.file = serializer.validated_data["file"]
            submission.submittedAt = timezone.now()
            submission.grade = None
            submission.feedback = ""
            submission.gradedAt = None
            submission.save()
        if created:
            from gamification.services import on_assignment_submit

            on_assignment_submit(user)
        return Response(
            AssignmentSubmissionSerializer(submission).data,
            status=201 if created else 200,
        )


class InstructorAssignmentListView(APIView):
    """GET/POST assignments for courses I teach."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get_queryset(self, user):
        qs = Assignment.objects.select_related(
            "course", "course__instructor"
        ).annotate(_submissions_count=Count("submissions"))
        if not user.is_admin:
            qs = qs.filter(course__instructor=user)
        return qs

    def get(self, request):
        assignments = self.get_queryset(request.user).order_by("-createdAt")
        return Response(AssignmentListSerializer(assignments, many=True).data)

    def post(self, request):
        serializer = AssignmentCreateUpdateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        data = AssignmentListSerializer(assignment).data
        return Response(data, status=201)


class InstructorAssignmentDetailView(APIView):
    """GET/PUT/PATCH/DELETE an assignment (course owner only)."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def _get_assignment(self, pk, user):
        assignment = get_object_or_404(
            Assignment.objects.select_related("course", "course__instructor"),
            pk=pk,
        )
        if not user.is_admin and (
            assignment.course.instructor_id != user.id
        ):
            raise PermissionDenied("You do not own this course.")
        return assignment

    def get(self, request, pk):
        assignment = self._get_assignment(pk, request.user)
        assignment._submissions_count = assignment.submissions.count()
        return Response(AssignmentListSerializer(assignment).data)

    def put(self, request, pk):
        assignment = self._get_assignment(pk, request.user)
        return self._update(request, assignment, partial=False)

    def patch(self, request, pk):
        assignment = self._get_assignment(pk, request.user)
        return self._update(request, assignment, partial=True)

    def _update(self, request, assignment, partial):
        serializer = AssignmentCreateUpdateSerializer(
            assignment,
            data=request.data,
            partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        return Response(AssignmentListSerializer(assignment).data)

    def delete(self, request, pk):
        assignment = self._get_assignment(pk, request.user)
        assignment.delete()
        return Response(status=204)


class InstructorAssignmentSubmissionsView(APIView):
    """GET list of student submissions for an assignment."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request, pk):
        assignment = get_object_or_404(
            Assignment.objects.select_related("course"), pk=pk
        )
        if not request.user.is_admin and (
            assignment.course.instructor_id != request.user.id
        ):
            raise PermissionDenied("You do not own this course.")
        submissions = assignment.submissions.select_related(
            "student"
        ).order_by("student__first_name", "student__last_name", "-submittedAt")
        return Response(
            AssignmentSubmissionSerializer(submissions, many=True).data
        )


class InstructorAssignmentGradeView(APIView):
    """POST {grade, feedback}: grade a student's submission."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def post(self, request, pk):
        submission = get_object_or_404(
            AssignmentSubmission.objects.select_related(
                "assignment", "assignment__course", "student"
            ),
            pk=pk,
        )
        if not request.user.is_admin and (
            submission.assignment.course.instructor_id != request.user.id
        ):
            raise PermissionDenied("You do not own this course.")

        serializer = AssignmentGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        grade = Decimal(str(serializer.validated_data["grade"]))
        max_grade = submission.assignment.points
        if grade > Decimal(max_grade):
            raise ValidationError(
                {
                    "detail": (
                        f"Grade cannot exceed the assignment maximum "
                        f"of {max_grade}."
                    )
                }
            )
        submission.grade = grade
        submission.feedback = serializer.validated_data.get("feedback", "")
        submission.gradedAt = timezone.now()
        submission.save(
            update_fields=["grade", "feedback", "gradedAt"]
        )
        notify(
            submission.student,
            "assignment",
            "Assignment graded",
            f"'{submission.assignment.title}' was graded: "
            f"{grade}/{submission.assignment.points} points.",
            link=f"/course/{submission.assignment.course_id}/assignments",
        )
        from gamification.services import on_assignment_graded

        on_assignment_graded(submission.student)
        return Response(AssignmentSubmissionSerializer(submission).data)