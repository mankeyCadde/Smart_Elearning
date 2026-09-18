from django.urls import path

from . import views

app_name = "assessments"

urlpatterns = [
    # ── Quizzes (student) ─────────────────────────────────────────────────
    path("quizzes/", views.QuizListView.as_view(), name="quiz-list"),
    path("quizzes/<int:pk>/", views.QuizDetailView.as_view(), name="quiz-detail"),
    path("quizzes/<int:pk>/start/", views.QuizStartView.as_view(), name="quiz-start"),
    path("quizzes/<int:pk>/submit/", views.QuizSubmitView.as_view(), name="quiz-submit"),
    # ── Submissions (student) ────────────────────────────────────────────
    path("submissions/", views.MySubmissionsView.as_view(), name="my-submissions"),
    path("submissions/<int:pk>/", views.SubmissionDetailView.as_view(), name="submission-detail"),
    # ── Assignments (student) ─────────────────────────────────────────────
    path("assignments/", views.AssignmentListView.as_view(), name="assignment-list"),
    path("assignments/<int:pk>/", views.AssignmentDetailView.as_view(), name="assignment-detail"),
]