from .models import Notification


def notify(user, type, title, message, link=""):
    """Create an in-app notification for `user`. No-op if user is falsy."""
    if not user:
        return None
    return Notification.objects.create(
        user=user, type=type, title=title, message=message, link=link
    )