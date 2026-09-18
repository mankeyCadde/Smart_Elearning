from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User

from .models import UserBadge, XpLog
from .serializers import BadgeSerializer, GamificationProfileSerializer, LeaderboardEntrySerializer


class GamificationMeView(APIView):
    """GET: my XP, level, streak, badges and leaderboard ranking."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = User.objects.prefetch_related(
            "user_badges__badge", "xp_logs"
        ).get(pk=request.user.pk)
        return Response(GamificationProfileSerializer(user).data)


class BadgeListView(APIView):
    """GET: the full badge catalog with my earned status."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import Badge

        badges = Badge.objects.all()
        earned_ids = set(
            UserBadge.objects.filter(user=request.user).values_list(
                "badge_id", flat=True
            )
        )
        dates = dict(
            UserBadge.objects.filter(user=request.user).values_list(
                "badge_id", "earnedAt"
            )
        )
        context = {"earned_ids": earned_ids, "earned_dates": dates}
        return Response(BadgeSerializer(badges, many=True, context=context).data)


class LeaderboardView(APIView):
    """GET: top learners. ?period=all|week|month"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get("period", "all")
        qs = XpLog.objects.all()
        if period == "week":
            qs = qs.filter(
                createdAt__gte=timezone.now() - timedelta(days=7)
            )
        elif period == "month":
            qs = qs.filter(
                createdAt__gte=timezone.now() - timedelta(days=30)
            )

        rows = (
            qs.values("user_id")
            .annotate(xp=Sum("amount"))
            .filter(xp__gt=0)
            .order_by("-xp", "user_id")[:20]
        )
        users = {
            u.id: u
            for u in User.objects.filter(
                id__in=[r["user_id"] for r in rows]
            ).prefetch_related("user_badges")
        }
        entries = [
            {
                "rank": 0,
                "user": users[r["user_id"]],
                "xp": r["xp"],
            }
            for r in rows
            if r["user_id"] in users
        ]
        for i, entry in enumerate(entries, start=1):
            entry["rank"] = i
        return Response(LeaderboardEntrySerializer(entries, many=True).data)