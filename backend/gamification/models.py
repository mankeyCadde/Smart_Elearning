from django.conf import settings
from django.db import models


class Badge(models.Model):
    class Category(models.TextChoices):
        LEARNING = "learning", "Learning"
        ENGAGEMENT = "engagement", "Engagement"
        ACHIEVEMENT = "achievement", "Achievement"

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=20, default="🏅")
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.ACHIEVEMENT
    )
    points = models.PositiveIntegerField(default=0)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "points", "code"]
        db_table = "gamification_badge"

    def __str__(self):
        return f"{self.name} ({self.code})"


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_badges",
    )
    badge = models.ForeignKey(
        Badge, on_delete=models.CASCADE, related_name="awards"
    )
    earnedAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "badge")]
        ordering = ["earnedAt"]
        db_table = "gamification_userbadge"

    def __str__(self):
        return f"{self.user} — {self.badge.name}"


class XpLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="xp_logs",
    )
    amount = models.PositiveIntegerField()
    source = models.CharField(max_length=30)
    description = models.CharField(max_length=255, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-createdAt"]
        db_table = "gamification_xplog"

    def __str__(self):
        return f"{self.user} +{self.amount} ({self.source})"