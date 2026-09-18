from django.conf import settings
from django.db import models

from courses.models import Lesson


class Topic(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="discussion_topics",
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="discussion_topics"
    )
    body = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-createdAt"]
        db_table = "discussions_topic"

    def __str__(self):
        return f"{self.author} — {self.lesson}"


class Reply(models.Model):
    topic = models.ForeignKey(
        Topic, on_delete=models.CASCADE, related_name="replies"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="discussion_replies",
    )
    body = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["createdAt"]
        db_table = "discussions_reply"

    def __str__(self):
        return f"Reply by {self.author} to {self.topic}"