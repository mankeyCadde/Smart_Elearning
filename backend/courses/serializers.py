import re

from rest_framework import serializers

from .models import Category, Course, Lesson, Review, Section


class CategorySerializer(serializers.ModelSerializer):
    coursesCount = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "description", "color", "icon", "coursesCount"]

    def get_coursesCount(self, obj):
        return getattr(obj, "_courses_count", 0)


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "content",
            "type",
            "duration",
            "order",
            "youtubeId",
            "videoUrl",
        ]

    def validate(self, attrs):
        video_url = attrs.get("videoUrl", "")
        if video_url and not attrs.get("youtubeId"):
            attrs["youtubeId"] = self._extract_youtube_id(video_url)
        return attrs

    @staticmethod
    def _extract_youtube_id(url):
        for pattern in (
            r"youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})",
            r"youtu\.be/([a-zA-Z0-9_-]{11})",
            r"youtube\.com/embed/([a-zA-Z0-9_-]{11})",
        ):
            m = re.search(pattern, url)
            if m:
                return m.group(1)
        return ""


class SectionSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ["id", "title", "order", "lessons"]


class SectionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "title", "order"]


class CourseSerializer(serializers.ModelSerializer):
    instructorName = serializers.CharField(
        source="instructor.full_name", read_only=True
    )
    enrolledStudents = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "instructor",
            "instructorName",
            "category",
            "price",
            "image",
            "level",
            "published",
            "rating",
            "reviews",
            "enrolledStudents",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["instructor", "rating", "reviews"]

    def get_enrolledStudents(self, obj):
        return getattr(obj, "_enrolled_count", 0)


class LessonPreviewSerializer(serializers.ModelSerializer):
    """Curriculum preview (public) — no lesson content or video ids."""

    class Meta:
        model = Lesson
        fields = ["id", "title", "type", "duration", "order"]


class SectionPreviewSerializer(serializers.ModelSerializer):
    lessons = LessonPreviewSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ["id", "title", "order", "lessons"]


class CourseDetailSerializer(CourseSerializer):
    sections = SectionPreviewSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ["sections"]


class LessonContentSerializer(serializers.ModelSerializer):
    """Lesson content for enrolled students, including progress."""

    progress = serializers.SerializerMethodField()
    bookmarked = serializers.SerializerMethodField()
    notesCount = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "content",
            "type",
            "duration",
            "order",
            "youtubeId",
            "videoUrl",
            "progress",
            "bookmarked",
            "notesCount",
        ]

    def get_progress(self, obj):
        record = getattr(obj, "_my_progress", None)
        if record is None:
            return {"completed": False, "lastPosition": 0, "completedAt": None}
        return {
            "completed": record.completed,
            "lastPosition": record.lastPosition,
            "completedAt": record.completedAt,
        }

    def get_bookmarked(self, obj):
        return bool(getattr(obj, "_bookmarked", False))

    def get_notesCount(self, obj):
        return getattr(obj, "_notes_count", 0)


class SectionContentSerializer(serializers.ModelSerializer):
    lessons = LessonContentSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ["id", "title", "order", "lessons"]


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "category",
            "price",
            "image",
            "level",
            "published",
        ]


# ── Reviews ───────────────────────────────────────────────────────────────────


class ReviewSerializer(serializers.ModelSerializer):
    studentId = serializers.IntegerField(source="student_id", read_only=True)
    studentName = serializers.CharField(source="student.full_name", read_only=True)
    courseId = serializers.IntegerField(source="course_id", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "studentId",
            "studentName",
            "courseId",
            "rating",
            "title",
            "comment",
            "instructorReply",
            "instructorReplyAt",
            "createdAt",
            "updatedAt",
        ]


class ReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    comment = serializers.CharField()


class ReviewUpdateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(
        min_value=1, max_value=5, required=False
    )
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    comment = serializers.CharField(required=False)


class InstructorReplySerializer(serializers.Serializer):
    reply = serializers.CharField()