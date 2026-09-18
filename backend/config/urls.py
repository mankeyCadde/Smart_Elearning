"""
URL configuration for SmartLearn backend.

All API endpoints are namespaced under /api/.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
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

# Serve uploaded media files in development (assignment submissions)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
