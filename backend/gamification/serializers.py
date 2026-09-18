from rest_framework import serializers

from users.models import User

from .models import Badge, UserBadge


class BadgeSerializer(serializers.ModelSerializer):
    earned = serializers.SerializerMethodField()
    earnedAt = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = [
            "id",
            "code",
            "name",
            "description",
            "icon",
            "category",
            "points",
            "earned",
            "earnedAt",
        ]

    def get_earned(self, obj):
        return obj.id in self.context.get("earned_ids", set())

    def get_earnedAt(self, obj):
        return self.context.get("earned_dates", {}).get(obj.id)


class UserBadgeSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source="badge.code", read_only=True)
    name = serializers.CharField(source="badge.name", read_only=True)
    description = serializers.CharField(
        source="badge.description", read_only=True
    )
    icon = serializers.CharField(source="badge.icon", read_only=True)
    category = serializers.CharField(source="badge.category", read_only=True)
    points = serializers.IntegerField(source="badge.points", read_only=True)

    class Meta:
        model = UserBadge
        fields = [
            "id",
            "code",
            "name",
            "description",
            "icon",
            "category",
            "points",
            "earnedAt",
        ]


class GamificationProfileSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name", read_only=True)
    badges = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    levelTitle = serializers.SerializerMethodField()
    ranking = serializers.SerializerMethodField()
    xpThisWeek = serializers.SerializerMethodField()
    xpThisMonth = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "fullName",
            "email",
            "avatar",
            "xp",
            "level",
            "levelTitle",
            "currentStreak",
            "longestStreak",
            "lastActivityDate",
            "ranking",
            "xpThisWeek",
            "xpThisMonth",
            "badges",
        ]

    def get_badges(self, obj):
        return UserBadgeSerializer(
            obj.user_badges.select_related("badge").order_by("earnedAt"),
            many=True,
        ).data

    def get_level(self, obj):
        return _level_for(obj.xp)

    def get_levelTitle(self, obj):
        return _level_title(_level_for(obj.xp))

    def get_ranking(self, obj):
        better = User.objects.filter(xp__gt=obj.xp).count()
        return better + 1

    def get_xpThisWeek(self, obj):
        from datetime import timedelta

        from django.utils import timezone

        start = timezone.now() - timedelta(days=7)
        return sum(
            log.amount
            for log in obj.xp_logs.filter(createdAt__gte=start)
        )

    def get_xpThisMonth(self, obj):
        from datetime import timedelta

        from django.utils import timezone

        start = timezone.now() - timedelta(days=30)
        return sum(
            log.amount
            for log in obj.xp_logs.filter(createdAt__gte=start)
        )


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.SerializerMethodField()
    userId = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    xp = serializers.SerializerMethodField()
    currentStreak = serializers.SerializerMethodField()
    badgesCount = serializers.SerializerMethodField()

    def get_rank(self, obj):
        return obj["rank"]

    def get_userId(self, obj):
        return obj["user"].id

    def get_name(self, obj):
        return obj["user"].full_name

    def get_email(self, obj):
        return obj["user"].email

    def get_avatar(self, obj):
        return obj["user"].avatar

    def get_xp(self, obj):
        return obj["xp"]

    def get_currentStreak(self, obj):
        return obj["user"].currentStreak

    def get_badgesCount(self, obj):
        return obj["user"].user_badges.count()


def _level_for(xp):
    thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000]
    level = 1
    for t in thresholds:
        if xp >= t:
            level += 1
    return level


def _level_title(level):
    titles = {
        1: "Curious Beginner",
        2: "Rising Learner",
        3: "Focused Student",
        4: "Dedicated Scholar",
        5: "Knowledge Builder",
        6: "Master Thinker",
        7: "Expert Mind",
        8: "Legend",
    }
    return titles.get(level, f"Level {level}")