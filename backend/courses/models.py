from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#3B82F6")
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Course(models.Model):
    class Level(models.TextChoices):
        BEGINNER = "BEGINNER", "Beginner"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        ADVANCED = "ADVANCED", "Advanced"

    title = models.CharField(max_length=200)
    description = models.TextField()
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    image = models.URLField(blank=True)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    published = models.BooleanField(default=False)

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reviews = models.IntegerField(default=0)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-createdAt"]

    def __str__(self):
        return self.title


class Section(models.Model):
    title = models.CharField(max_length=200)
    order = models.IntegerField(default=0)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="sections")

    class Meta:
        ordering = ["order"]
        unique_together = [("course", "order")]

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class Lesson(models.Model):
    class Type(models.TextChoices):
        TEXT = "TEXT", "Text"
        VIDEO = "VIDEO", "Video"
        QUIZ = "QUIZ", "Quiz"
        ASSIGNMENT = "ASSIGNMENT", "Assignment"

    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.TEXT)
    duration = models.IntegerField(default=0, help_text="Duration in seconds")
    order = models.IntegerField(default=0)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="lessons")

    youtubeId = models.CharField(max_length=20, blank=True)
    videoUrl = models.URLField(blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = [("section", "order")]

    def __str__(self):
        return f"{self.section.title} — {self.title}"


class Review(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_reviews",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="reviews_list"
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    instructorReply = models.TextField(blank=True)
    instructorReplyAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-createdAt"]
        unique_together = [("student", "course")]
        db_table = "courses_review"

    def __str__(self):
        return f"{self.student} — {self.course} ({self.rating}★)"