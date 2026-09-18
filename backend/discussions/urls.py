from django.urls import path

from . import views

app_name = "discussions"

urlpatterns = [
    path(
        "lessons/<int:lesson_id>/discussions/",
        views.TopicListView.as_view(),
        name="topic-list",
    ),
    path(
        "discussions/<int:pk>/",
        views.TopicDetailView.as_view(),
        name="topic-detail",
    ),
    path(
        "discussions/<int:pk>/replies/",
        views.ReplyCreateView.as_view(),
        name="reply-create",
    ),
    path(
        "replies/<int:pk>/",
        views.ReplyDetailView.as_view(),
        name="reply-detail",
    ),
]