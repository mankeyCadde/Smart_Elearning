from django.urls import path

from . import views

app_name = "admin-courses"

urlpatterns = [
    path("courses/", views.AdminCourseListView.as_view(), name="admin-course-list"),
    path("courses/<int:pk>/", views.AdminCourseManageView.as_view(), name="admin-course-manage"),
]