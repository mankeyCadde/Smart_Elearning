"""
URL configuration for SmartLearn backend.

All API endpoints are namespaced under /api/.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(request):
    """Lightweight liveness probe used by the hosting platform."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    # Health check (must not require authentication)
    path("api/health/", health, name="health"),
    # Django admin
    path("admin/", admin.site.urls),
    # API endpoints — each app will register its own routes under /api/
    path("api/", include("users.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/instructor/", include("courses.instructor_urls")),
    path("api/instructor/", include("assessments.instructor_urls")),
    path("api/admin/", include("courses.admin_urls")),
    path("api/admin/", include("commerce.admin_urls")),
    path("api/", include("commerce.urls")),
    path("api/", include("learning.urls")),
    path("api/", include("assessments.urls")),
    path("api/", include("analytics.urls")),
    path("api/", include("discussions.urls")),
    path("api/", include("messaging.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("gamification.urls")),
    path("api/", include("certificates.urls")),
]
