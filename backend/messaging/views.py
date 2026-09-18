from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.services import notify

from .models import Conversation, Message
from .serializers import (
    ConversationReplySerializer,
    ConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
)


class SendMessageView(APIView):
    """POST {recipientId, body}: create or reuse a conversation and send."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        recipient = serializer.validated_data["recipient"]
        conversation, _ = Conversation.for_pair(
            request.user, recipient
        )
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=serializer.validated_data["body"],
        )
        conversation.lastMessageAt = timezone.now()
        conversation.save(update_fields=["lastMessageAt"])
        notify(
            recipient,
            "message",
            f"New message from {request.user.full_name}",
            message.body[:140],
            link=f"/messages/{conversation.id}",
        )
        from gamification.services import on_message_sent

        on_message_sent(request.user)
        return Response(
            {
                "conversationId": conversation.id,
                "message": MessageSerializer(message).data,
            },
            status=201,
        )


class MyConversationsView(APIView):
    """GET: my conversations with preview + unread count."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        conversations = list(
            Conversation.objects.filter(
                Q(userOne=user) | Q(userTwo=user)
            ).select_related("userOne", "userTwo")
        )
        conv_ids = [c.id for c in conversations]
        if not conv_ids:
            return Response([])

        messages = list(
            Message.objects.filter(conversation_id__in=conv_ids)
            .select_related("sender")
            .order_by("createdAt")
        )
        last_by_conv = {}
        unread_by_conv = {cid: 0 for cid in conv_ids}
        for m in messages:
            last_by_conv[m.conversation_id] = m
            if not m.isRead and m.sender_id != user.id:
                unread_by_conv[m.conversation_id] += 1
        for c in conversations:
            c._last_message = last_by_conv.get(c.id)
            c._unread_count = unread_by_conv.get(c.id, 0)

        conversations.sort(key=lambda c: c.lastMessageAt, reverse=True)
        return Response(
            ConversationSerializer(
                conversations, many=True, context={"request": request}
            ).data
        )


class ConversationDetailView(APIView):
    """GET messages (marks inbound as read) / POST send into this thread."""

    permission_classes = [IsAuthenticated]

    def _get_conversation(self, pk, user):
        conversation = get_object_or_404(
            Conversation.objects.select_related("userOne", "userTwo"), pk=pk
        )
        if user.id not in (conversation.userOne_id, conversation.userTwo_id):
            raise PermissionDenied("You are not part of this conversation.")
        return conversation

    def get(self, request, pk):
        conversation = self._get_conversation(pk, request.user)
        Message.objects.filter(
            conversation=conversation, isRead=False
        ).exclude(sender=request.user).update(isRead=True)
        messages = Message.objects.filter(conversation=conversation).select_related(
            "sender"
        )
        return Response(MessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        conversation = self._get_conversation(pk, request.user)
        serializer = ConversationReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipient = (
            conversation.userTwo
            if conversation.userOne_id == request.user.id
            else conversation.userOne
        )
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=serializer.validated_data["body"],
        )
        conversation.lastMessageAt = timezone.now()
        conversation.save(update_fields=["lastMessageAt"])
        notify(
            recipient,
            "message",
            f"New message from {request.user.full_name}",
            message.body[:140],
            link=f"/messages/{conversation.id}",
        )
        from gamification.services import on_message_sent

        on_message_sent(request.user)
        return Response(MessageSerializer(message).data, status=201)