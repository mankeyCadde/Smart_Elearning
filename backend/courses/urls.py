from django.urls import path

from learning.views import CourseAttendanceView

from . import views

app_name = "courses"

urlpatterns = [
    # ── Public catalog ────────────────────────────────────────────────────
    path("categories/", views.PublicCategoryListView.as_view(), name="category-list"),
    path("", views.CourseListView.as_view(), name="course-list"),
    path("<int:pk>/", views.CourseDetailView.as_view(), name="course-detail"),
    # ── Enrolled/instructor learning content ──────────────────────────────
    path("<int:pk>/content/", views.CourseContentView.as_view(), name="course-content"),
    path(
        "<int:course_id>/attendance/",
        CourseAttendanceView.as_view(),
        name="course-attendance",
    ),
    # ── Reviews (public list / student create) ────────────────────────────
    path("<int:course_id>/reviews/", views.CourseReviewsView.as_view(), name="course-reviews"),
    # ── Curriculum (instructor) ───────────────────────────────────────────
    path("<int:course_id>/curriculum/", views.CurriculumView.as_view(), name="curriculum"),
    path("<int:course_id>/sections/", views.SectionCreateView.as_view(), name="section-create"),
    path("<int:course_id>/sections/<int:section_id>/", views.SectionDetailView.as_view(), name="section-detail"),
    path("<int:course_id>/sections/<int:section_id>/lessons/", views.LessonCreateView.as_view(), name="lesson-create"),
    path("<int:course_id>/sections/<int:section_id>/lessons/<int:lesson_id>/", views.LessonDetailView.as_view(), name="lesson-detail"),
]