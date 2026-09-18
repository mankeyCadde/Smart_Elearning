from django.urls import path

from . import views

app_name = "instructor-courses"

urlpatterns = [
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("courses/", views.InstructorCourseListView.as_view(), name="instructor-course-list"),
    path("courses/<int:pk>/", views.InstructorCourseDetailView.as_view(), name="instructor-course-detail"),
    path("reviews/<int:pk>/reply/", views.InstructorReviewReplyView.as_view(), name="instructor-review-reply"),
]