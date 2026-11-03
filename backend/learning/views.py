from django.db import models
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course, Lesson
from users.permissions import IsAdmin, IsInstructor

from .access import accepted_enrollment_or_403
from .models import (
    Attendance,
    Bookmark,
    Enrollment,
    LessonProgress,
    Note,
)
from .serializers import (
    AttendanceCourseSerializer,
    AttendanceSerializer,
    BookmarkCreateSerializer,
    BookmarkSerializer,
    EnrollSerializer,
    EnrollmentSerializer,
    LessonProgressSerializer,
    LessonProgressUpdateSerializer,
    NoteCreateSerializer,
    NoteSerializer,
    NoteUpdateSerializer,
)


def _my_enrollments_queryset(user):
    return (
        Enrollment.objects.filter(student=user)
        .select_related("course", "course__instructor")
        .annotate(
            _sections_count=Count("course__sections", distinct=True),
            _total_lessons=Count(
                "course__sections__lessons", distinct=True
            ),
            _completed_lessons=Count(
                "lesson_progress",
                filter=Q(lesson_progress__completed=True),
                distinct=True,
            ),
        )
    )


# ── Enrollments ──────────────────────────────────────────────────────────────


class MyEnrollmentsView(APIView):
    """GET: authenticated student's enrollments with course + progress."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = _my_enrollments_queryset(request.user)
        return Response(EnrollmentSerializer(enrollments, many=True).data)


class EnrollView(APIView):
    """POST {courseId}: enroll the authenticated student in a published course."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EnrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = get_object_or_404(
            Course,
            pk=serializer.validated_data["courseId"],
            published=True,
        )
        if request.user.enrollments.filter(course=course).exists():
            raise ValidationError(
                {"detail": "You are already enrolled in this course."}
            )
        if course.price > 0:
            raise ValidationError(
                {
                    "detail": (
                        "Paid courses require checkout and a verified payment. "
                        "Enrollment requests are only available for free courses."
                    )
                }
            )
        enrollment = Enrollment.objects.create(
            student=request.user, course=course, price=course.price
        )
        from notifications.services import notify

        notify(
            request.user,
            "course",
            "Enrollment request sent",
            f"Your enrollment request for '{course.title}' has been sent for approval.",
            link=f"/course/{course.id}",
        )
        data = EnrollmentSerializer(
            _my_enrollments_queryset(request.user).get(pk=enrollment.pk)
        ).data
        return Response(data, status=status.HTTP_201_CREATED)


class UnenrollView(APIView):
    """DELETE: remove the authenticated student's enrollment."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        enrollment = get_object_or_404(
            Enrollment, pk=pk, student=request.user
        )
        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Instructor Enrollment Requests ───────────────────────────────────────────

class InstructorEnrollmentRequestsView(APIView):
    """GET: list enrollment requests for instructor's courses."""
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request):
        if request.user.is_admin:
            qs = Enrollment.objects.all()
        else:
            qs = Enrollment.objects.filter(course__instructor=request.user)
        
        qs = qs.order_by(
            models.Case(
                models.When(status=Enrollment.Status.PENDING, then=0),
                default=1,
            ),
            "-enrolledAt"
        ).select_related("course", "student")
        
        from .serializers import InstructorEnrollmentRequestSerializer
        return Response(InstructorEnrollmentRequestSerializer(qs, many=True).data)

class InstructorAcceptEnrollmentView(APIView):
    """PATCH: accept an enrollment request."""
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def patch(self, request, pk):
        if request.user.is_admin:
            enrollment = get_object_or_404(Enrollment, pk=pk)
        else:
            enrollment = get_object_or_404(Enrollment, pk=pk, course__instructor=request.user)
        
        if enrollment.status != Enrollment.Status.PENDING:
            raise ValidationError({"detail": "Only pending requests can be accepted."})
            
        enrollment.status = Enrollment.Status.ACCEPTED
        enrollment.save(update_fields=["status"])
        
        from notifications.services import notify
        notify(
            enrollment.student,
            "course",
            "Enrollment accepted",
            f"Your enrollment request for '{enrollment.course.title}' has been accepted.",
            link=f"/course/{enrollment.course.id}",
        )
        from .serializers import InstructorEnrollmentRequestSerializer
        return Response(InstructorEnrollmentRequestSerializer(enrollment).data)

class InstructorRejectEnrollmentView(APIView):
    """PATCH: reject an enrollment request."""
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def patch(self, request, pk):
        if request.user.is_admin:
            enrollment = get_object_or_404(Enrollment, pk=pk)
        else:
            enrollment = get_object_or_404(Enrollment, pk=pk, course__instructor=request.user)
            
        if enrollment.status != Enrollment.Status.PENDING:
            raise ValidationError({"detail": "Only pending requests can be rejected."})
            
        enrollment.status = Enrollment.Status.REJECTED
        enrollment.save(update_fields=["status"])
        
        from notifications.services import notify
        notify(
            enrollment.student,
            "course",
            "Enrollment rejected",
            f"Your enrollment request for '{enrollment.course.title}' has been rejected.",
            link=f"/course/{enrollment.course.id}",
        )
        from .serializers import InstructorEnrollmentRequestSerializer
        return Response(InstructorEnrollmentRequestSerializer(enrollment).data)


# ── Lesson progress ──────────────────────────────────────────────────────────


class LessonProgressView(APIView):
    """PATCH {completed, lastPosition}: update progress for a lesson the
    authenticated student is enrolled in."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        enrollment = accepted_enrollment_or_403(
            request.user, lesson.section.course
        )

        serializer = LessonProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        progress, _ = LessonProgress.objects.get_or_create(
            enrollment=enrollment, lesson=lesson
        )
        was_completed = progress.completed
        if "completed" in data:
            progress.completed = data["completed"]
            progress.completedAt = (
                timezone.now() if data["completed"] else None
            )
        if "lastPosition" in data:
            progress.lastPosition = data["lastPosition"]
        progress.save()
        if progress.completed and not was_completed:
            from gamification.services import on_lesson_complete

            on_lesson_complete(request.user)
            from certificates.services import issue_certificate_if_eligible

            issue_certificate_if_eligible(enrollment)

        return Response(LessonProgressSerializer(progress).data)


# ── Attendance (student) ─────────────────────────────────────────────────────


class _AttendanceBaseMixin:
    permission_classes = [IsAuthenticated]

    def require_enrollment(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id, published=True)
        if not request.user.enrollments.filter(course=course, status="ACCEPTED").exists():
            raise PermissionDenied(
                "You must be enrolled in this course to mark attendance."
            )
        return course


class MyAttendanceView(APIView):
    """GET: authenticated student's attendance records."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        attendance = (
            Attendance.objects.filter(student=request.user)
            .select_related("course")
            .order_by("-sessionDate")
        )
        return Response(AttendanceSerializer(attendance, many=True).data)


class AttendanceCheckInView(_AttendanceBaseMixin, APIView):
    """POST {courseId}: check in for today's session."""

    def post(self, request):
        serializer = AttendanceCourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = self.require_enrollment(
            request, serializer.validated_data["courseId"]
        )
        attendance, _ = Attendance.objects.get_or_create(
            student=request.user,
            course=course,
            sessionDate=timezone.localdate(),
        )
        if not attendance.checkedInAt:
            attendance.checkedInAt = timezone.now()
            attendance.save(update_fields=["checkedInAt"])
        return Response(AttendanceSerializer(attendance).data)


class AttendanceCheckOutView(_AttendanceBaseMixin, APIView):
    """POST {courseId}: check out for today's session."""

    def post(self, request):
        serializer = AttendanceCourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = self.require_enrollment(
            request, serializer.validated_data["courseId"]
        )
        attendance, _ = Attendance.objects.get_or_create(
            student=request.user,
            course=course,
            sessionDate=timezone.localdate(),
        )
        attendance.checkedOutAt = timezone.now()
        attendance.save(update_fields=["checkedOutAt"])
        return Response(AttendanceSerializer(attendance).data)


# ── Notes ────────────────────────────────────────────────────────────────────


class NoteListView(APIView):
    """GET list (own, ?lesson=<id> filter) / POST create note."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = Note.objects.filter(student=request.user).select_related(
            "lesson", "lesson__section", "lesson__section__course"
        )
        lesson_id = request.query_params.get("lesson")
        if lesson_id:
            notes = notes.filter(lesson_id=lesson_id)
        return Response(NoteSerializer(notes, many=True).data)

    def post(self, request):
        serializer = NoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = get_object_or_404(
            Lesson.objects.select_related("section", "section__course"),
            pk=serializer.validated_data["lessonId"],
        )
        accepted_enrollment_or_403(request.user, lesson.section.course)
        note = Note.objects.create(
            student=request.user,
            lesson=lesson,
            content=serializer.validated_data["content"],
        )
        return Response(
            NoteSerializer(
                Note.objects.select_related(
                    "lesson", "lesson__section", "lesson__section__course"
                ).get(pk=note.pk)
            ).data,
            status=status.HTTP_201_CREATED,
        )


class NoteDetailView(APIView):
    """GET/PATCH/DELETE one of the authenticated user's notes."""

    permission_classes = [IsAuthenticated]

    def _get_note(self, request, pk):
        return get_object_or_404(Note, pk=pk, student=request.user)

    def get(self, request, pk):
        note = self._get_note(request, pk)
        return Response(NoteSerializer(note).data)

    def patch(self, request, pk):
        note = self._get_note(request, pk)
        serializer = NoteUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note.content = serializer.validated_data["content"]
        note.save(update_fields=["content", "updatedAt"])
        return Response(NoteSerializer(note).data)

    def delete(self, request, pk):
        note = self._get_note(request, pk)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Bookmarks ────────────────────────────────────────────────────────────────


class BookmarkListView(APIView):
    """GET list (own, ?lesson=<id> filter) / POST toggle-on a bookmark."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookmarks = (
            Bookmark.objects.filter(student=request.user)
            .select_related("lesson", "lesson__section", "lesson__section__course")
        )
        lesson_id = request.query_params.get("lesson")
        if lesson_id:
            bookmarks = bookmarks.filter(lesson_id=lesson_id)
        return Response(BookmarkSerializer(bookmarks, many=True).data)

    def post(self, request):
        serializer = BookmarkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = get_object_or_404(
            Lesson.objects.select_related("section", "section__course"),
            pk=serializer.validated_data["lessonId"],
        )
        accepted_enrollment_or_403(request.user, lesson.section.course)
        bookmark, created = Bookmark.objects.get_or_create(
            student=request.user, lesson=lesson
        )
        return Response(
            BookmarkSerializer(bookmark).data,
            status=(status.HTTP_201_CREATED if created else status.HTTP_200_OK),
        )


class BookmarkDetailView(APIView):
    """DELETE one of the authenticated user's bookmarks."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        bookmark = get_object_or_404(
            Bookmark, pk=pk, student=request.user
        )
        bookmark.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Attendance (instructor view) ─────────────────────────────────────────────


class CourseAttendanceView(APIView):
    """GET /api/courses/<id>/attendance/?date=YYYY-MM-DD
    Instructor (own course) or admin lists attendance records."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request, course_id):
        if request.user.is_admin:
            course = get_object_or_404(Course, pk=course_id)
        else:
            course = get_object_or_404(
                Course, pk=course_id, instructor=request.user
            )
        qs = Attendance.objects.filter(course=course).select_related(
            "student", "course"
        )
        date = request.query_params.get("date")
        if date:
            qs = qs.filter(sessionDate=date)
        return Response(AttendanceSerializer(qs, many=True).data)