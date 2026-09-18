from django.urls import path

from . import views

app_name = "analytics"

urlpatterns = [
    # ── Student ───────────────────────────────────────────────────────────
    path("analytics/student/dashboard/", views.StudentDashboardView.as_view(), name="student-dashboard"),
    # ── Instructor ────────────────────────────────────────────────────────
    path("analytics/instructor/dashboard/", views.InstructorDashboardView.as_view(), name="instructor-dashboard"),
    path("analytics/instructor/courses/<int:course_id>/students/", views.CourseEngagementView.as_view(), name="instructor-course-students"),
    # ── Admin ─────────────────────────────────────────────────────────────
    path("analytics/admin/dashboard/", views.AdminDashboardView.as_view(), name="admin-dashboard"),
    path("analytics/admin/activity/", views.AdminActivityView.as_view(), name="admin-activity"),
]