from rest_framework import serializers

from .models import Reply, Topic


class ReplySerializer(serializers.ModelSerializer):
    topicId = serializers.IntegerField(source="topic_id", read_only=True)
    authorId = serializers.IntegerField(source="author_id", read_only=True)
    authorName = serializers.CharField(
        source="author.full_name", read_only=True
    )

    class Meta:
        model = Reply
        fields = ["id", "topicId", "authorId", "authorName", "body", "createdAt"]


class ReplyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reply
        fields = ["body"]
        extra_kwargs = {"body": {"allow_blank": False}}


class TopicSerializer(serializers.ModelSerializer):
    authorId = serializers.IntegerField(source="author_id", read_only=True)
    authorName = serializers.CharField(
        source="author.full_name", read_only=True
    )
    lessonId = serializers.IntegerField(source="lesson_id", read_only=True)
    replies = ReplySerializer(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = [
            "id",
            "authorId",
            "authorName",
            "lessonId",
            "body",
            "createdAt",
            "updatedAt",
            "replies",
        ]


class TopicCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["body"]
        extra_kwargs = {"body": {"allow_blank": False}}