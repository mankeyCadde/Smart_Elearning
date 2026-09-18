from django.conf import settings
from django.db import models

from courses.models import Course


class Quiz(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="quizzes"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    timeLimitMinutes = models.PositiveIntegerField(default=10)
    passingScore = models.DecimalField(
        max_digits=5, decimal_places=2, default=70.00
    )
    maxAttempts = models.PositiveIntegerField(default=1)
    dueDate = models.DateTimeField(null=True, blank=True)
    published = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-createdAt"]
        db_table = "assessments_quiz"

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class Question(models.Model):
    class Type(models.TextChoices):
        MULTIPLE_CHOICE = "MC", "Multiple choice"
        TRUE_FALSE = "TF", "True / False"
        SHORT_ANSWER = "SA", "Short answer"

    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name="questions"
    )
    text = models.TextField()
    questionType = models.CharField(
        max_length=2,
        choices=Type.choices,
        default=Type.MULTIPLE_CHOICE,
    )
    points = models.PositiveIntegerField(default=1)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = [("quiz", "order")]
        db_table = "assessments_question"

    def __str__(self):
        return f"{self.quiz.title} — Q{self.order}"


class AnswerOption(models.Model):
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="options"
    )
    text = models.TextField()
    isCorrect = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = [("question", "order")]
        db_table = "assessments_answeroption"

    def __str__(self):
        return self.text


class Submission(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        COMPLETED = "COMPLETED", "Completed"
        GRADED = "GRADED", "Graded"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_submissions",
    )
    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name="submissions"
    )
    attemptNumber = models.PositiveIntegerField(default=1)
    startedAt = models.DateTimeField(auto_now_add=True)
    completedAt = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.IN_PROGRESS
    )
    score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    class Meta:
        ordering = ["-startedAt"]
        unique_together = [("student", "quiz", "attemptNumber")]
        db_table = "assessments_submission"

    def __str__(self):
        return f"{self.student} — {self.quiz.title} (#{self.attemptNumber})"


class SubmissionAnswer(models.Model):
    submission = models.ForeignKey(
        Submission, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="submission_answers"
    )
    selectedOption = models.ForeignKey(
        AnswerOption,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submission_answers",
    )
    textAnswer = models.TextField(blank=True)
    isCorrect = models.BooleanField(null=True)
    pointsAwarded = models.DecimalField(
        max_digits=6, decimal_places=2, default=0
    )

    class Meta:
        ordering = ["question__order"]
        unique_together = [("submission", "question")]
        db_table = "assessments_submissionanswer"

    def __str__(self):
        return f"{self.submission} — {self.question}"


class Assignment(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="assignments"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    dueDate = models.DateTimeField(null=True, blank=True)
    points = models.PositiveIntegerField(default=10)
    published = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-createdAt"]
        db_table = "assessments_assignment"

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignment_submissions",
    )
    content = models.TextField(blank=True)
    file = models.FileField(
        upload_to="assignment_submissions/", null=True, blank=True
    )
    submittedAt = models.DateTimeField(auto_now_add=True)
    grade = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    feedback = models.TextField(blank=True)
    gradedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-submittedAt"]
        unique_together = [("assignment", "student")]
        db_table = "assessments_assignmentsubmission"

    def __str__(self):
        return f"{self.student} — {self.assignment.title}"