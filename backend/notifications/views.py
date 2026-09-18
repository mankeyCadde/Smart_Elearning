from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    """GET /api/notifications/?unread=1 → my notifications."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)
        if request.query_params.get("unread") == "1":
            qs = qs.filter(isRead=False)
        return Response(NotificationSerializer(qs, many=True).data)


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, isRead=False
        ).count()
        return Response({"unreadCount": count})


class NotificationMarkReadView(APIView):
    """POST /api/notifications/<id>/read/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk)
        if notification.user_id != request.user.id:
            raise PermissionDenied("This is not your notification.")
        notification.isRead = True
        notification.save(update_fields=["isRead"])
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    """POST /api/notifications/read-all/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user, isRead=False
        ).update(isRead=True)
        return Response({"updated": updated})