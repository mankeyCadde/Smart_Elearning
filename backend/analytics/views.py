from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from assessments.models import Question, Quiz, Submission
from courses.models import Course, Lesson
from learning.models import Attendance, Enrollment
from users.permissions import IsAdmin, IsInstructor

User = get_user_model()

# ── helpers ───────────────────────────────────────────────────────────────────


def _money(value):
    return str((value or Decimal("0")).quantize(Decimal("0.01")))


def _course_lesson_count(course_id):
    return (
        Lesson.objects.filter(section__course_id=course_id).count()
    )


def _enrollment_progress(enrollment, total_lessons):
    """Return (completed, progress_percent) for an enrollment."""
    completed = enrollment.lesson_progress.filter(completed=True).count()
    percent = round(completed / total_lessons * 100, 2) if total_lessons else 0
    return completed, percent


def _quiz_summary(submissions):
    """submissions: iterable of (score, passing_score)."""
    scores = [s for s in submissions if s[0] is not None]
    if not scores:
        return {
            "taken": 0,
            "averageScore": None,
            "passed": 0,
            "passRate": None,
        }
    avg = round(sum(float(s) for s, _ in scores) / len(scores), 2)
    passed = sum(1 for s, p in scores if s >= p)
    return {
        "taken": len(scores),
        "averageScore": avg,
        "passed": passed,
        "passRate": round(passed / len(scores) * 100, 2),
    }


# ── Student dashboard ────────────────────────────────────────────────────────


class StudentDashboardView(APIView):
    """GET: aggregated learning stats + per-course breakdown for the user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enrollments = list(
            Enrollment.objects.filter(student=user).select_related(
                "course", "course__instructor", "course__category"
            )
        )
        course_ids = [e.course_id for e in enrollments]

        lessons_per_course = {}
        for e in enrollments:
            lessons_per_course[e.course_id] = _course_lesson_count(e.course_id)

        completed_overall = 0
        total_overall = 0
        courses = []
        for e in enrollments:
            total = lessons_per_course[e.course_id]
            completed, percent = _enrollment_progress(e, total)
            completed_overall += completed
            total_overall += total

            quiz_subs = Submission.objects.filter(
                student=user,
                quiz__course_id=e.course_id,
                score__isnull=False,
            ).select_related("quiz")
            q = _quiz_summary(
                [(s.score, s.quiz.passingScore) for s in quiz_subs]
            )
            attendance = Attendance.objects.filter(
                student=user, course_id=e.course_id
            ).count()

            courses.append(
                {
                    "courseId": e.course_id,
                    "courseTitle": e.course.title,
                    "instructorName": e.course.instructor.full_name,
                    "category": (
                        e.course.category.name if e.course.category else None
                    ),
                    "image": e.course.image,
                    "level": e.course.level,
                    "price": str(e.price),
                    "enrolledAt": e.enrolledAt.isoformat(),
                    "completedAt": (
                        e.completedAt.isoformat() if e.completedAt else None
                    ),
                    "completedLessons": completed,
                    "totalLessons": total,
                    "progress": percent,
                    "quiz": q,
                    "attendanceDays": attendance,
                    "sectionsCount": e.course.sections.count(),
                }
            )

        overall_progress = (
            round(completed_overall / total_overall * 100, 2)
            if total_overall
            else 0
        )

        all_quiz_subs = list(
            Submission.objects.filter(
                student=user, score__isnull=False
            ).select_related("quiz")
        )
        quiz_overall = _quiz_summary(
            [(s.score, s.quiz.passingScore) for s in all_quiz_subs]
        )
        attendance_overall = Attendance.objects.filter(
            student=user
        ).count()

        return Response(
            {
                "summary": {
                    "coursesEnrolled": len(courses),
                    "completedCourses": sum(
                        1 for c in courses if c["completedAt"] is not None
                    ),
                    "completedLessons": completed_overall,
                    "totalLessons": total_overall,
                    "overallProgress": overall_progress,
                    "quiz": quiz_overall,
                    "attendanceSessions": attendance_overall,
                },
                "courses": courses,
            }
        )


# ── Instructor dashboard ─────────────────────────────────────────────────────


class InstructorDashboardView(APIView):
    """GET: aggregated stats for the instructor's courses."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request):
        if request.user.is_admin:
            courses_qs = Course.objects.all()
        else:
            courses_qs = Course.objects.filter(instructor=request.user)

        courses = list(
            courses_qs.annotate(
                _enroll_count=Count("enrollments", distinct=True),
                _revenue=Sum("enrollments__price"),
            ).select_related("category")
        )
        course_ids = [c.id for c in courses]

        lessons_per_course = {cid: _course_lesson_count(cid) for cid in course_ids}

        rows = []
        total_enrollments = 0
        total_revenue = Decimal("0")
        total_students = set()
        total_lessons = 0
        rating_sum = 0
        rating_weight = 0
        for c in courses:
            enrollments = list(
                Enrollment.objects.filter(course_id=c.id).select_related(
                    "student"
                )
            )
            total_enrollments += len(enrollments)
            total_students.update(e.student_id for e in enrollments)
            revenue = c._revenue or Decimal("0")
            total_revenue += revenue

            progress_values = []
            for e in enrollments:
                total = lessons_per_course[c.id]
                _, percent = _enrollment_progress(e, total)
                progress_values.append(percent)
            avg_progress = (
                round(sum(progress_values) / len(progress_values), 2)
                if progress_values
                else None
            )

            quiz_subs = list(
                Submission.objects.filter(
                    quiz__course_id=c.id, score__isnull=False
                ).select_related("quiz")
            )
            q = _quiz_summary(
                [(s.score, s.quiz.passingScore) for s in quiz_subs]
            )
            attendance_count = Attendance.objects.filter(
                course_id=c.id
            ).count()

            lessons_available = lessons_per_course[c.id]
            total_lessons += lessons_available
            if c.reviews:
                rating_sum += float(c.rating) * c.reviews
                rating_weight += c.reviews

            rows.append(
                {
                    "courseId": c.id,
                    "courseTitle": c.title,
                    "published": c.published,
                    "category": (
                        c.category.name if c.category else None
                    ),
                    "enrolledStudents": len(enrollments),
                    "revenue": _money(revenue),
                    "averageProgress": avg_progress,
                    "quiz": q,
                    "attendanceSessions": attendance_count,
                    "totalLessons": lessons_available,
                    "rating": str(c.rating),
                    "reviews": c.reviews,
                }
            )

        rows.sort(key=lambda r: r["enrolledStudents"], reverse=True)

        return Response(
            {
                "summary": {
                    "courses": len(courses),
                    "publishedCourses": sum(1 for c in courses if c.published),
                    "totalLessons": total_lessons,
                    "totalEnrollments": total_enrollments,
                    "totalStudents": len(total_students),
                    "totalRevenue": _money(total_revenue),
                    "averageRating": (
                        round(rating_sum / rating_weight, 2)
                        if rating_weight
                        else None
                    ),
                },
                "courses": rows,
            }
        )


class CourseEngagementView(APIView):
    """GET: per-student engagement for one of the instructor's courses."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request, course_id):
        if request.user.is_admin:
            course = Course.objects.filter(pk=course_id).first()
        else:
            course = Course.objects.filter(
                pk=course_id, instructor=request.user
            ).first()
        if not course:
            return Response({"detail": "Course not found."}, status=404)

        total_lessons = _course_lesson_count(course_id)
        enrollments = Enrollment.objects.filter(course_id=course_id).select_related(
            "student"
        )

        students = []
        for e in enrollments:
            completed, percent = _enrollment_progress(e, total_lessons)
            quiz_subs = list(
                Submission.objects.filter(
                    student_id=e.student_id,
                    quiz__course_id=course_id,
                    score__isnull=False,
                ).select_related("quiz")
            )
            q = _quiz_summary(
                [(s.score, s.quiz.passingScore) for s in quiz_subs]
            )
            attendance = Attendance.objects.filter(
                student_id=e.student_id, course_id=course_id
            ).count()
            students.append(
                {
                    "studentId": e.student_id,
                    "studentName": e.student.full_name,
                    "studentEmail": e.student.email,
                    "enrolledAt": e.enrolledAt.isoformat(),
                    "progress": percent,
                    "completedLessons": completed,
                    "totalLessons": total_lessons,
                    "quiz": q,
                    "attendanceSessions": attendance,
                    "lastActivity": e.lesson_progress.order_by(
                        "-updatedAt"
                    ).values_list("updatedAt", flat=True).first(),
                }
            )
        students.sort(key=lambda s: s["progress"], reverse=True)

        return Response(
            {
                "courseId": course_id,
                "courseTitle": course.title,
                "totalLessons": total_lessons,
                "students": students,
            }
        )


# ── Admin dashboard ──────────────────────────────────────────────────────────


class AdminDashboardView(APIView):
    """GET: platform-wide stats."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        students = User.objects.filter(role=User.Role.STUDENT).count()
        instructors = User.objects.filter(role=User.Role.INSTRUCTOR).count()
        admins = User.objects.filter(role=User.Role.ADMIN).count()

        total_courses = Course.objects.count()
        published_courses = Course.objects.filter(published=True).count()
        unpublished_courses = total_courses - published_courses

        enrollment_total = Enrollment.objects.count()
        revenue = Enrollment.objects.aggregate(total=Sum("price"))["total"] or 0

        quiz_count = Quiz.objects.count()
        question_count = Question.objects.count()
        submission_count = Submission.objects.count()
        graded_count = Submission.objects.filter(
            status=Submission.Status.GRADED
        ).count()

        attendance_total = Attendance.objects.count()

        cat_rows = (
            Course.objects.filter(category__isnull=False)
            .values("category__name")
            .annotate(
                courses=Count("id", distinct=True),
                enrollments=Count("enrollments", distinct=True),
            )
            .order_by("-enrollments")
        )
        category_distribution = [
            {
                "category": r["category__name"],
                "courses": r["courses"],
                "enrollments": r["enrollments"],
            }
            for r in cat_rows
        ]

        return Response(
            {
                "users": {
                    "total": User.objects.count(),
                    "students": students,
                    "instructors": instructors,
                    "admins": admins,
                },
                "courses": {
                    "total": total_courses,
                    "published": published_courses,
                    "unpublished": unpublished_courses,
                },
                "enrollments": {
                    "total": enrollment_total,
                    "revenue": _money(revenue),
                },
                "assessments": {
                    "quizzes": quiz_count,
                    "questions": question_count,
                    "submissions": submission_count,
                    "gradedSubmissions": graded_count,
                },
                "attendance": {"sessions": attendance_total},
                "categories": category_distribution,
            }
        )


class AdminActivityView(APIView):
    """GET: recent site activity (enrollments, submissions, attendance)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        limit = min(int(request.query_params.get("limit", 10)), 50)

        recent_enrollments = (
            Enrollment.objects.order_by("-enrolledAt")[:limit]
            .select_related("student", "course")
        )
        recent_submissions = (
            Submission.objects.filter(completedAt__isnull=False)
            .order_by("-completedAt")[:limit]
            .select_related("student", "quiz")
        )
        recent_attendance = (
            Attendance.objects.order_by("-sessionDate", "-checkedInAt")[:limit]
            .select_related("student", "course")
        )

        return Response(
            {
                "enrollments": [
                    {
                        "studentName": e.student.full_name,
                        "studentEmail": e.student.email,
                        "courseId": e.course_id,
                        "courseTitle": e.course.title,
                        "at": e.enrolledAt.isoformat(),
                    }
                    for e in recent_enrollments
                ],
                "submissions": [
                    {
                        "studentName": s.student.full_name,
                        "quizTitle": s.quiz.title,
                        "courseTitle": s.quiz.course.title,
                        "score": str(s.score) if s.score is not None else None,
                        "at": s.completedAt.isoformat(),
                    }
                    for s in recent_submissions
                ],
                "attendance": [
                    {
                        "studentName": a.student.full_name,
                        "courseTitle": a.course.title,
                        "sessionDate": a.sessionDate.isoformat(),
                        "checkedInAt": (
                            a.checkedInAt.isoformat()
                            if a.checkedInAt
                            else None
                        ),
                        "checkedOutAt": (
                            a.checkedOutAt.isoformat()
                            if a.checkedOutAt
                            else None
                        ),
                    }
                    for a in recent_attendance
                ],
            }
        )