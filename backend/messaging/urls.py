from django.urls import path

from . import views

app_name = "messaging"

urlpatterns = [
    path("messages/send/", views.SendMessageView.as_view(), name="message-send"),
    path(
        "messages/conversations/",
        views.MyConversationsView.as_view(),
        name="conversation-list",
    ),
    path(
        "messages/conversations/<int:pk>/",
        views.ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
]