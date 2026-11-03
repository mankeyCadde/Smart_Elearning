from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db.models import Count, Sum
from rest_framework import serializers

from courses.models import Course

from .models import (
    AnswerOption,
    Assignment,
    AssignmentSubmission,
    Question,
    Quiz,
    Submission,
    SubmissionAnswer,
)


# ── Student-facing (correct answers hidden) ───────────────────────────────────


class AnswerOptionPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "order"]


class QuestionPublicSerializer(serializers.ModelSerializer):
    options = AnswerOptionPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "questionType", "points", "order", "options"]


class QuizStudentListSerializer(serializers.ModelSerializer):
    courseId = serializers.IntegerField(source="course_id", read_only=True)
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    questionsCount = serializers.SerializerMethodField()
    attemptsUsed = serializers.SerializerMethodField()
    attemptsLeft = serializers.SerializerMethodField()
    bestScore = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "courseId",
            "courseTitle",
            "timeLimitMinutes",
            "passingScore",
            "maxAttempts",
            "dueDate",
            "published",
            "questionsCount",
            "attemptsUsed",
            "attemptsLeft",
            "bestScore",
        ]

    def get_questionsCount(self, obj):
        return getattr(obj, "_questions_count", 0)

    def get_attemptsUsed(self, obj):
        return getattr(obj, "_attempts_used", 0)

    def get_attemptsLeft(self, obj):
        used = getattr(obj, "_attempts_used", 0)
        return max(obj.maxAttempts - used, 0)

    def get_bestScore(self, obj):
        return getattr(obj, "_best_score", None)


class QuizStudentDetailSerializer(QuizStudentListSerializer):
    questions = QuestionPublicSerializer(many=True, read_only=True)
    inProgressSubmissionId = serializers.SerializerMethodField()

    class Meta(QuizStudentListSerializer.Meta):
        fields = QuizStudentListSerializer.Meta.fields + [
            "questions",
            "inProgressSubmissionId",
        ]

    def get_inProgressSubmissionId(self, obj):
        for submission in getattr(obj, "_in_progress_submissions", []):
            if submission.student_id == self.context["request"].user.id:
                return submission.id
        return None


class SubmissionListSerializer(serializers.ModelSerializer):
    quizId = serializers.IntegerField(source="quiz_id", read_only=True)
    quizTitle = serializers.CharField(source="quiz.title", read_only=True)
    studentName = serializers.CharField(
        source="student.full_name", read_only=True
    )
    answersCount = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "quizId",
            "quizTitle",
            "studentName",
            "attemptNumber",
            "status",
            "score",
            "startedAt",
            "completedAt",
            "answersCount",
        ]

    def get_answersCount(self, obj):
        return getattr(obj, "_answers_count", 0)


class SubmissionAnswerDetailSerializer(serializers.ModelSerializer):
    questionId = serializers.IntegerField(source="question_id", read_only=True)
    questionText = serializers.CharField(source="question.text", read_only=True)
    questionType = serializers.CharField(
        source="question.questionType", read_only=True
    )
    points = serializers.IntegerField(source="question.points", read_only=True)
    selectedOptionId = serializers.IntegerField(
        source="selectedOption_id", read_only=True
    )
    selectedOptionText = serializers.CharField(
        source="selectedOption.text", read_only=True, default=None
    )

    class Meta:
        model = SubmissionAnswer
        fields = [
            "id",
            "questionId",
            "questionText",
            "questionType",
            "points",
            "selectedOptionId",
            "selectedOptionText",
            "textAnswer",
            "isCorrect",
            "pointsAwarded",
        ]


class SubmissionDetailSerializer(serializers.ModelSerializer):
    quizId = serializers.IntegerField(source="quiz_id", read_only=True)
    quizTitle = serializers.CharField(source="quiz.title", read_only=True)
    courseTitle = serializers.CharField(
        source="quiz.course.title", read_only=True
    )
    answers = SubmissionAnswerDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "quizId",
            "quizTitle",
            "courseTitle",
            "attemptNumber",
            "status",
            "score",
            "startedAt",
            "completedAt",
            "answers",
        ]


# ── Instructor-facing (includes correct answers, write support) ───────────────


class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "isCorrect", "order"]
        extra_kwargs = {"id": {"read_only": True}}


class QuestionSerializer(serializers.ModelSerializer):
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "questionType", "points", "order", "options"]


class QuizListSerializer(serializers.ModelSerializer):
    courseId = serializers.IntegerField(source="course_id", read_only=True)
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    questionsCount = serializers.SerializerMethodField()
    submissionsCount = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "courseId",
            "courseTitle",
            "timeLimitMinutes",
            "passingScore",
            "maxAttempts",
            "dueDate",
            "published",
            "questionsCount",
            "submissionsCount",
            "createdAt",
            "updatedAt",
        ]

    def get_questionsCount(self, obj):
        return getattr(obj, "_questions_count", 0)

    def get_submissionsCount(self, obj):
        return getattr(obj, "_submissions_count", 0)


class QuizDetailSerializer(QuizListSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(QuizListSerializer.Meta):
        fields = QuizListSerializer.Meta.fields + ["questions"]


class AnswerOptionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "isCorrect", "order"]
        extra_kwargs = {"id": {"read_only": True}}


class QuestionWriteSerializer(serializers.ModelSerializer):
    options = AnswerOptionWriteSerializer(
        many=True, required=False, allow_empty=True
    )

    class Meta:
        model = Question
        fields = ["id", "text", "questionType", "points", "order", "options"]
        extra_kwargs = {"id": {"read_only": True}}


class QuizWriteSerializer(serializers.ModelSerializer):
    courseId = serializers.PrimaryKeyRelatedField(
        source="course", queryset=Course.objects.all()
    )
    questions = QuestionWriteSerializer(
        many=True, required=False, allow_empty=True
    )

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "courseId",
            "timeLimitMinutes",
            "passingScore",
            "maxAttempts",
            "dueDate",
            "published",
            "questions",
        ]

    def validate(self, attrs):
        course = attrs.get("course")
        if course is None:
            return attrs
        request = self.context.get("request")
        user = request.user
        if not (user.is_admin or (
            user.is_instructor and course.instructor_id == user.id
        )):
            raise serializers.ValidationError(
                {"courseId": "You do not own this course."}
            )
        return attrs

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        quiz = Quiz.objects.create(**validated_data)
        self._create_questions(quiz, questions_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)
        if questions_data is not None:
            if instance.submissions.exists():
                raise serializers.ValidationError(
                    {
                        "questions": "Cannot edit questions after students "
                        "have submitted attempts."
                    }
                )
            instance.questions.all().delete()
            self._create_questions(instance, questions_data)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    @staticmethod
    def _create_questions(quiz, questions_data):
        for index, question_data in enumerate(questions_data):
            options_data = question_data.pop("options", [])
            question_data.setdefault("order", index)
            question = Question.objects.create(quiz=quiz, **question_data)
            for option_index, option_data in enumerate(options_data):
                option_data.setdefault("order", option_index)
                AnswerOption.objects.create(question=question, **option_data)


# ── Instructor submission review ──────────────────────────────────────────────


class InstructorSubmissionAnswerSerializer(serializers.ModelSerializer):
    questionId = serializers.IntegerField(source="question_id", read_only=True)
    questionText = serializers.CharField(source="question.text", read_only=True)
    questionType = serializers.CharField(
        source="question.questionType", read_only=True
    )
    answerText = serializers.SerializerMethodField()

    class Meta:
        model = SubmissionAnswer
        fields = [
            "id",
            "questionId",
            "questionType",
            "questionText",
            "answerText",
            "isCorrect",
            "pointsAwarded",
        ]

    def get_answerText(self, obj):
        if obj.question.questionType == Question.Type.SHORT_ANSWER:
            return obj.textAnswer
        return obj.selectedOption.text if obj.selectedOption else None


class InstructorSubmissionSerializer(serializers.ModelSerializer):
    studentId = serializers.IntegerField(source="student_id", read_only=True)
    studentName = serializers.CharField(
        source="student.full_name", read_only=True
    )
    studentEmail = serializers.CharField(
        source="student.email", read_only=True
    )
    quizTitle = serializers.CharField(source="quiz.title", read_only=True)
    answers = InstructorSubmissionAnswerSerializer(many=True, read_only=True)
    autoGraded = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "studentId",
            "studentName",
            "studentEmail",
            "quizTitle",
            "attemptNumber",
            "status",
            "score",
            "startedAt",
            "completedAt",
            "autoGraded",
            "answers",
        ]

    def get_autoGraded(self, obj):
        return not obj.answers.filter(
            question__questionType=Question.Type.SHORT_ANSWER,
            isCorrect__isnull=True,
        ).exists()


class SubmissionGradeSerializer(serializers.Serializer):
    answers = serializers.ListField(
        child=serializers.DictField(), allow_empty=True
    )


class SubmitAnswerSerializer(serializers.Serializer):
    questionId = serializers.IntegerField()
    optionId = serializers.IntegerField(required=False)
    textAnswer = serializers.CharField(required=False, allow_blank=True)


class QuizSubmitSerializer(serializers.Serializer):
    answers = SubmitAnswerSerializer(many=True)


# ── Assignments ───────────────────────────────────────────────────────────────


def submission_file_url(submission):
    if not submission.file:
        return None
    return f"/assignment-submissions/{submission.pk}/file/"


def validate_assignment_file_size(file):
    if file.size > settings.ASSIGNMENT_MAX_UPLOAD_BYTES:
        max_mb = settings.ASSIGNMENT_MAX_UPLOAD_BYTES / (1024 * 1024)
        raise serializers.ValidationError(
            f"File size cannot exceed {max_mb:g} MB."
        )


def validate_assignment_content_type(file):
    content_type = (getattr(file, "content_type", "") or "").lower()
    if (
        content_type
        and content_type not in settings.ASSIGNMENT_ALLOWED_CONTENT_TYPES
    ):
        raise serializers.ValidationError(
            "This file type is not allowed for assignment submissions."
        )


class AssignmentListSerializer(serializers.ModelSerializer):
    courseId = serializers.IntegerField(source="course_id", read_only=True)
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    submissionsCount = serializers.SerializerMethodField()
    mySubmission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "courseId",
            "courseTitle",
            "title",
            "description",
            "dueDate",
            "points",
            "published",
            "submissionsCount",
            "mySubmission",
            "createdAt",
            "updatedAt",
        ]

    def get_submissionsCount(self, obj):
        return getattr(obj, "_submissions_count", 0)

    def get_mySubmission(self, obj):
        submission = getattr(obj, "_my_submission", None)
        if submission is None:
            return None
        return {
            "id": submission.id,
            "content": submission.content,
            "file": submission_file_url(submission),
            "submittedAt": submission.submittedAt.isoformat(),
            "grade": (
                str(submission.grade) if submission.grade is not None else None
            ),
            "feedback": submission.feedback,
            "gradedAt": (
                submission.gradedAt.isoformat()
                if submission.gradedAt
                else None
            ),
        }


class AssignmentCreateUpdateSerializer(serializers.ModelSerializer):
    courseId = serializers.PrimaryKeyRelatedField(
        source="course", queryset=Course.objects.all()
    )

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "courseId",
            "dueDate",
            "points",
            "published",
        ]
        extra_kwargs = {"id": {"read_only": True}}

    def validate(self, attrs):
        course = attrs.get("course")
        if course is None:
            return attrs
        user = self.context["request"].user
        if not (user.is_admin or (
            user.is_instructor and course.instructor_id == user.id
        )):
            raise serializers.ValidationError(
                {"courseId": "You do not own this course."}
            )
        return attrs


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignmentId = serializers.IntegerField(
        source="assignment_id", read_only=True
    )
    assignmentTitle = serializers.CharField(
        source="assignment.title", read_only=True
    )
    studentId = serializers.IntegerField(source="student_id", read_only=True)
    studentName = serializers.CharField(
        source="student.full_name", read_only=True
    )
    studentEmail = serializers.CharField(
        source="student.email", read_only=True
    )
    file = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id",
            "assignmentId",
            "assignmentTitle",
            "studentId",
            "studentName",
            "studentEmail",
            "content",
            "file",
            "submittedAt",
            "grade",
            "feedback",
            "gradedAt",
        ]

    def get_file(self, obj):
        return submission_file_url(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["status"] = (
            "GRADED" if instance.grade is not None else "SUBMITTED"
        )
        return data


class AssignmentSubmitSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True)
    file = serializers.FileField(
        required=False,
        validators=[
            FileExtensionValidator(
                allowed_extensions=settings.ASSIGNMENT_ALLOWED_FILE_EXTENSIONS
            ),
            validate_assignment_file_size,
            validate_assignment_content_type,
        ],
    )


class AssignmentGradeSerializer(serializers.Serializer):
    grade = serializers.DecimalField(max_digits=6, decimal_places=2)
    feedback = serializers.CharField(required=False, allow_blank=True)