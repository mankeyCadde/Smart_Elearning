import secrets
import string

from django.utils import timezone

from courses.models import Lesson
from learning.models import LessonProgress

from .models import Certificate


def generate_certificate_code(year=None):
    """Generate a unique certificate code like SL-2026-A7KQ9X."""
    year = year or timezone.localdate().year
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = f"SL-{year}-{''.join(secrets.choice(alphabet) for _ in range(6))}"
        if not Certificate.objects.filter(certificateCode=code).exists():
            return code


def course_completed(enrollment):
    total = Lesson.objects.filter(section__course=enrollment.course).count()
    if total == 0:
        return False
    done = LessonProgress.objects.filter(
        enrollment=enrollment, completed=True,
        lesson__section__course=enrollment.course,
    ).count()
    return done == total


def issue_certificate_if_eligible(enrollment):
    """Mark the enrollment complete when every lesson is done, then issue a
    certificate (idempotent). Returns the Certificate or None."""
    if not course_completed(enrollment):
        return None
    if not enrollment.completedAt:
        enrollment.completedAt = timezone.now()
        enrollment.save(update_fields=["completedAt"])

    certificate, _created = Certificate.objects.get_or_create(
        student=enrollment.student,
        course=enrollment.course,
        defaults={
            "certificateCode": generate_certificate_code(),
            "earnedAt": enrollment.completedAt,
        },
    )
    return certificate