from django.urls import path

from . import views

app_name = "assessments_instructor"

urlpatterns = [
    # ── Quizzes (instructor) ──────────────────────────────────────────────
    path("quizzes/", views.InstructorQuizListView.as_view(), name="instructor-quiz-list"),
    path("quizzes/<int:pk>/", views.InstructorQuizDetailView.as_view(), name="instructor-quiz-detail"),
    path("quizzes/<int:pk>/submissions/", views.InstructorQuizSubmissionsView.as_view(), name="instructor-quiz-submissions"),
    # ── Manual SA grading (instructor) ────────────────────────────────────
    path("submissions/<int:pk>/grade/", views.InstructorSubmissionGradeView.as_view(), name="instructor-submission-grade"),
    # ── Assignments (instructor) ──────────────────────────────────────────
    path("assignments/", views.InstructorAssignmentListView.as_view(), name="instructor-assignment-list"),
    path("assignments/<int:pk>/", views.InstructorAssignmentDetailView.as_view(), name="instructor-assignment-detail"),
    path("assignments/<int:pk>/submissions/", views.InstructorAssignmentSubmissionsView.as_view(), name="instructor-assignment-submissions"),
    path("assignment-submissions/<int:pk>/grade/", views.InstructorAssignmentGradeView.as_view(), name="instructor-assignment-grade"),
]