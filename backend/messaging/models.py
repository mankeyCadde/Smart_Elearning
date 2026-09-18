from django.conf import settings
from django.db import models


class Conversation(models.Model):
    userOne = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_one",
    )
    userTwo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_two",
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    lastMessageAt = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["userOne", "userTwo"],
                name="uq_conversation_pair",
            )
        ]
        ordering = ["-lastMessageAt"]
        db_table = "messaging_conversation"

    def __str__(self):
        return f"{self.userOne} ↔ {self.userTwo}"

    @classmethod
    def for_pair(cls, a, b):
        """Get-or-create a conversation, storing the lower user id first."""
        if a.id == b.id:
            raise ValueError("A user cannot message themselves.")
        if a.id < b.id:
            first, second = a, b
        else:
            first, second = b, a
        return cls.objects.get_or_create(
            userOne=first, userTwo=second
        )


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    body = models.TextField()
    isRead = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["createdAt"]
        db_table = "messaging_message"

    def __str__(self):
        return f"{self.sender}: {self.body[:40]}"