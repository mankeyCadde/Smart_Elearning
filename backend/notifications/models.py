from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        SYSTEM = "system", "System"
        COURSE = "course", "Course Updates"
        ASSIGNMENT = "assignment", "Assignments"
        QUIZ = "quiz", "Quizzes"
        DISCUSSION = "discussion", "Discussions"
        REVIEW = "review", "Reviews"
        MESSAGE = "message", "Messages"
        ACHIEVEMENT = "achievement", "Achievements"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=300, blank=True)
    isRead = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-createdAt", "-id"]
        db_table = "notifications_notification"

    def __str__(self):
        return f"[{self.type}] {self.user} — {self.title}"