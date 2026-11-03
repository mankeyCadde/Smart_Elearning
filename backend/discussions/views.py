from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course, Lesson
from learning.access import has_accepted_enrollment
from notifications.services import notify
from users.permissions import IsAdmin, IsInstructor

from .models import Reply, Topic
from .serializers import (
    ReplyCreateSerializer,
    ReplySerializer,
    TopicCreateSerializer,
    TopicSerializer,
)


def _can_access(user, lesson):
    if user.is_admin:
        return True
    course = lesson.section.course if lesson.section else None
    if course is None:
        return False
    if user.is_instructor and course.instructor_id == user.id:
        return True
    return has_accepted_enrollment(user, course)


def _can_post(user, lesson):
    if user.is_admin:
        return True
    course = lesson.section.course if lesson.section else None
    if course is None:
        return False
    if user.is_instructor and course.instructor_id == user.id:
        return True
    return has_accepted_enrollment(user, course)


def _get_allowed_lesson(pk, user):
    lesson = get_object_or_404(
        Lesson.objects.select_related("section", "section__course"),
        pk=pk,
    )
    if not _can_access(user, lesson):
        raise PermissionDenied("You must be enrolled in this course.")
    return lesson


def _get_allowed_topic(pk, user):
    topic = get_object_or_404(
        Topic.objects.select_related(
            "lesson", "lesson__section", "lesson__section__course"
        ),
        pk=pk,
    )
    if not _can_access(user, topic.lesson):
        raise PermissionDenied("You must be enrolled in this course.")
    return topic


class TopicListView(APIView):
    """GET list + POST create topics for a lesson's discussion."""

    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_id):
        lesson = _get_allowed_lesson(lesson_id, request.user)
        topics = (
            Topic.objects.filter(lesson=lesson)
            .select_related("author")
            .prefetch_related(
                Prefetch(
                    "replies",
                    queryset=Reply.objects.select_related("author").order_by(
                        "createdAt"
                    ),
                )
            )
            .order_by("-createdAt")
        )
        return Response(TopicSerializer(topics, many=True).data)

    def post(self, request, lesson_id):
        lesson = _get_allowed_lesson(lesson_id, request.user)
        if not _can_post(request.user, lesson):
            raise PermissionDenied("You must be enrolled in this course.")
        serializer = TopicCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        topic = Topic.objects.create(
            author=request.user,
            lesson=lesson,
            body=serializer.validated_data["body"],
        )
        from gamification.services import on_discussion_topic

        on_discussion_topic(request.user)
        return Response(TopicSerializer(topic).data, status=201)


class TopicDetailView(APIView):
    """GET/PATCH/DELETE a topic (author, instructor, or admin)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        topic = _get_allowed_topic(pk, request.user)
        topic = (
            Topic.objects.select_related("author")
            .prefetch_related(
                "replies__author",
            )
            .get(pk=topic.pk)
        )
        return Response(TopicSerializer(topic).data)

    def patch(self, request, pk):
        topic = _get_allowed_topic(pk, request.user)
        if not _can_post(request.user, topic.lesson):
            raise PermissionDenied("You must be enrolled in this course.")
        if not (request.user.is_admin or topic.author_id == request.user.id):
            raise PermissionDenied("You can only edit your own topic.")
        serializer = TopicCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        topic.body = serializer.validated_data.get("body", topic.body)
        topic.save(update_fields=["body", "updatedAt"])
        return Response(TopicSerializer(topic).data)

    def delete(self, request, pk):
        topic = _get_allowed_topic(pk, request.user)
        if not (
            request.user.is_admin
            or request.user.is_instructor
            or topic.author_id == request.user.id
        ):
            raise PermissionDenied("You cannot delete this topic.")
        topic.delete()
        return Response(status=204)


class ReplyCreateView(APIView):
    """POST a reply to a topic."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        topic = _get_allowed_topic(pk, request.user)
        if not _can_post(request.user, topic.lesson):
            raise PermissionDenied("You must be enrolled in this course.")
        serializer = ReplyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = Reply.objects.create(
            topic=topic,
            author=request.user,
            body=serializer.validated_data["body"],
        )
        if reply.author_id != topic.author_id:
            notify(
                topic.author,
                "discussion",
                "New reply on your question",
                f"{request.user.full_name} replied to your discussion.",
                link=f"/course/{topic.lesson.section.course_id}/discussions",
            )
        from gamification.services import on_discussion_reply

        on_discussion_reply(request.user)
        return Response(ReplySerializer(reply).data, status=201)


class ReplyDetailView(APIView):
    """DELETE a reply (author, course instructor, or admin)."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        reply = get_object_or_404(
            Reply.objects.select_related(
                "topic",
                "topic__lesson",
                "topic__lesson__section",
                "topic__lesson__section__course",
            ),
            pk=pk,
        )
        if not _can_access(request.user, reply.topic.lesson):
            raise PermissionDenied("You must be enrolled in this course.")
        lesson = reply.topic.lesson
        course = lesson.section.course if lesson.section else None
        is_instructor_of_course = course and course.instructor_id == request.user.id
        if not (
            request.user.is_admin
            or request.user.id == reply.author_id
            or (request.user.is_instructor and is_instructor_of_course)
        ):
            raise PermissionDenied("You cannot delete this reply.")
        reply.delete()
        return Response(status=204)