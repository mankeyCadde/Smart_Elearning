from django.conf import settings
from django.db import models

from courses.models import Course


class Certificate(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="certificates"
    )
    certificateCode = models.CharField(max_length=40, unique=True)
    issuedAt = models.DateTimeField(auto_now_add=True)
    earnedAt = models.DateTimeField(
        null=True, blank=True, help_text="When the course was completed."
    )

    class Meta:
        ordering = ["-issuedAt"]
        unique_together = [("student", "course")]
        db_table = "certificates_certificate"

    def __str__(self):
        return f"{self.student} — {self.course} ({self.certificateCode})"