from django.contrib import admin

from .models import Reply, Topic


class ReplyInline(admin.TabularInline):
    model = Reply
    extra = 0
    readonly_fields = ("author", "body")


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("lesson", "author", "createdAt", "updatedAt")
    search_fields = ("author__email",)
    inlines = [ReplyInline]


@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ("topic", "author", "createdAt")