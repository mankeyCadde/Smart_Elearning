from rest_framework.exceptions import PermissionDenied

from .models import Enrollment


def has_accepted_enrollment(user, course):
    if not user or not user.is_authenticated:
        return False
    return Enrollment.objects.filter(
        student=user,
        course=course,
        status=Enrollment.Status.ACCEPTED,
    ).exists()


def accepted_enrollment_or_403(user, course):
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")
    enrollment = Enrollment.objects.filter(
        student=user,
        course=course,
        status=Enrollment.Status.ACCEPTED,
    ).first()
    if not enrollment:
        raise PermissionDenied(
            "You must have an accepted enrollment in this course."
        )
    return enrollment
