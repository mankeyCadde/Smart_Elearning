from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="get_type_display", read_only=True)
    time = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "category",
            "title",
            "message",
            "link",
            "isRead",
            "createdAt",
            "time",
        ]
        read_only_fields = fields

    def get_time(self, obj):
        return obj.createdAt.isoformat()