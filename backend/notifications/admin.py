from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "title", "isRead", "createdAt")
    list_filter = ("type", "isRead")
    search_fields = ("user__email", "title")