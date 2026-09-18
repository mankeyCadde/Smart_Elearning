from rest_framework import serializers

from users.models import User

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    conversationId = serializers.IntegerField(
        source="conversation_id", read_only=True
    )
    senderId = serializers.IntegerField(source="sender_id", read_only=True)
    senderName = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversationId",
            "senderId",
            "senderName",
            "body",
            "isRead",
            "createdAt",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    otherUserId = serializers.SerializerMethodField()
    otherUserName = serializers.SerializerMethodField()
    otherUserAvatar = serializers.SerializerMethodField()
    unreadCount = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "createdAt",
            "lastMessageAt",
            "otherUserId",
            "otherUserName",
            "otherUserAvatar",
            "unreadCount",
            "lastMessage",
        ]

    def _other(self, obj):
        user = self.context["request"].user if "request" in self.context else None
        if user is not None:
            return obj.userTwo if obj.userOne_id == user.id else obj.userOne
        return None

    def get_otherUserId(self, obj):
        other = self._other(obj)
        return other.id if other else None

    def get_otherUserName(self, obj):
        other = self._other(obj)
        return other.full_name if other else ""

    def get_otherUserAvatar(self, obj):
        other = self._other(obj)
        return other.avatar if other else ""

    def get_unreadCount(self, obj):
        return getattr(obj, "_unread_count", 0)

    def get_lastMessage(self, obj):
        message = getattr(obj, "_last_message", None)
        if message is None:
            return None
        return {
            "id": message.id,
            "senderId": message.sender_id,
            "senderName": message.sender.full_name,
            "body": message.body,
            "isRead": message.isRead,
            "createdAt": message.createdAt.isoformat(),
        }


class SendMessageSerializer(serializers.Serializer):
    recipientId = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="recipient"
    )
    body = serializers.CharField(allow_blank=False, max_length=5000)

    def validate(self, attrs):
        if attrs["recipient"].id == self.context["request"].user.id:
            raise serializers.ValidationError(
                {"recipientId": "You cannot message yourself."}
            )
        return attrs


class ConversationReplySerializer(serializers.Serializer):
    body = serializers.CharField(allow_blank=False, max_length=5000)