from django.contrib import admin

from .models import Badge, UserBadge, XpLog


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "points")
    list_filter = ("category",)


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("user", "badge", "earnedAt")
    list_filter = ("badge__category",)
    search_fields = ("user__email",)


@admin.register(XpLog)
class XpLogAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "source", "createdAt")
    list_filter = ("source",)
    search_fields = ("user__email",)