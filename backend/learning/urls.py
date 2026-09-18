from django.urls import path

from courses.views import ReviewDetailView

from . import views

app_name = "learning"

urlpatterns = [
    # ── Enrollments ───────────────────────────────────────────────────────
    path("enrollments/mine/", views.MyEnrollmentsView.as_view(), name="enrollments-mine"),
    path("enrollments/", views.EnrollView.as_view(), name="enroll"),
    path("enrollments/<int:pk>/", views.UnenrollView.as_view(), name="unenroll"),
    # ── Instructor Enrollment Requests ───────────────────────────────────
    path("instructor/enrollment-requests/", views.InstructorEnrollmentRequestsView.as_view(), name="instructor-enrollment-requests"),
    path("instructor/enrollment-requests/<int:pk>/accept/", views.InstructorAcceptEnrollmentView.as_view(), name="instructor-accept-enrollment"),
    path("instructor/enrollment-requests/<int:pk>/reject/", views.InstructorRejectEnrollmentView.as_view(), name="instructor-reject-enrollment"),
    # ── Lesson progress ──────────────────────────────────────────────────
    path("lessons/<int:lesson_id>/progress/", views.LessonProgressView.as_view(), name="lesson-progress"),
    # ── Attendance (student) ─────────────────────────────────────────────
    path("attendance/mine/", views.MyAttendanceView.as_view(), name="attendance-mine"),
    path("attendance/check-in/", views.AttendanceCheckInView.as_view(), name="attendance-check-in"),
    path("attendance/check-out/", views.AttendanceCheckOutView.as_view(), name="attendance-check-out"),
    # ── Notes ────────────────────────────────────────────────────────────
    path("notes/", views.NoteListView.as_view(), name="note-list"),
    path("notes/<int:pk>/", views.NoteDetailView.as_view(), name="note-detail"),
    # ── Bookmarks ────────────────────────────────────────────────────────
    path("bookmarks/", views.BookmarkListView.as_view(), name="bookmark-list"),
    path("bookmarks/<int:pk>/", views.BookmarkDetailView.as_view(), name="bookmark-detail"),
    # ── Reviews (detail / student update/delete) ─────────────────────────
    path("reviews/<int:pk>/", ReviewDetailView.as_view(), name="review-detail"),
]