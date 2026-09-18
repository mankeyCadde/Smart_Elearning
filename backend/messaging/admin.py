from django.contrib import admin

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("sender", "body")


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("userOne", "userTwo", "lastMessageAt")
    search_fields = ("userOne__email", "userTwo__email")
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "sender", "isRead", "createdAt", "body")
    search_fields = ("body",)