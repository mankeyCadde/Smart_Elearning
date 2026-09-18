from django.conf import settings
from django.db import models

from courses.models import Course, Lesson


class Enrollment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )
    enrolledAt = models.DateTimeField(auto_now_add=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    completedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-enrolledAt"]
        unique_together = [("student", "course")]
        db_table = "learning_enrollment"

    def __str__(self):
        return f"{self.student} → {self.course}"


class LessonProgress(models.Model):
    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="progress_records"
    )
    completed = models.BooleanField(default=False)
    lastPosition = models.IntegerField(default=0)
    completedAt = models.DateTimeField(null=True, blank=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updatedAt"]
        unique_together = [("enrollment", "lesson")]
        db_table = "learning_lessonprogress"

    def __str__(self):
        return f"{self.enrollment.student} — {self.lesson.title}"


class Attendance(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="attendance_records"
    )
    sessionDate = models.DateField()
    checkedInAt = models.DateTimeField(null=True, blank=True)
    checkedOutAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-sessionDate", "student__email"]
        unique_together = [("student", "course", "sessionDate")]
        db_table = "learning_attendance"

    def __str__(self):
        return f"{self.student} @ {self.course} on {self.sessionDate}"


class Note(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="notes"
    )
    content = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updatedAt"]
        db_table = "learning_note"

    def __str__(self):
        return f"{self.student} — {self.lesson.title}"


class Bookmark(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="bookmarks"
    )
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-createdAt"]
        unique_together = [("student", "lesson")]
        db_table = "learning_bookmark"

    def __str__(self):
        return f"{self.student} — {self.lesson.title}"