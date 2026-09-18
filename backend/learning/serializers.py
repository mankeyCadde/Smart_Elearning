from rest_framework import serializers

from .models import (
    Attendance,
    Bookmark,
    Enrollment,
    LessonProgress,
    Note,
)


class EnrollmentSerializer(serializers.ModelSerializer):
    courseId = serializers.IntegerField(source="course_id", read_only=True)
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    instructorName = serializers.CharField(
        source="course.instructor.full_name", read_only=True
    )
    image = serializers.URLField(source="course.image", read_only=True)
    level = serializers.CharField(source="course.level", read_only=True)
    sectionsCount = serializers.SerializerMethodField()
    lessonCount = serializers.SerializerMethodField()
    completedLessonsCount = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "courseId",
            "courseTitle",
            "instructorName",
            "image",
            "level",
            "price",
            "enrolledAt",
            "completedAt",
            "sectionsCount",
            "lessonCount",
            "completedLessonsCount",
            "progress",
        ]

    def get_sectionsCount(self, obj):
        return getattr(obj, "_sections_count", 0)

    def get_lessonCount(self, obj):
        return getattr(obj, "_total_lessons", 0)

    def get_completedLessonsCount(self, obj):
        return getattr(obj, "_completed_lessons", 0)

    def get_progress(self, obj):
        total = getattr(obj, "_total_lessons", 0)
        done = getattr(obj, "_completed_lessons", 0)
        return round(done / total * 100, 2) if total else 0


class EnrollSerializer(serializers.Serializer):
    courseId = serializers.IntegerField()


class LessonProgressSerializer(serializers.ModelSerializer):
    lessonId = serializers.IntegerField(source="lesson_id", read_only=True)
    lessonTitle = serializers.CharField(source="lesson.title", read_only=True)
    sectionOrder = serializers.IntegerField(
        source="lesson.section.order", read_only=True
    )
    lessonOrder = serializers.IntegerField(source="lesson.order", read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            "id",
            "lessonId",
            "lessonTitle",
            "sectionOrder",
            "lessonOrder",
            "completed",
            "lastPosition",
            "completedAt",
            "updatedAt",
        ]


class LessonProgressUpdateSerializer(serializers.Serializer):
    completed = serializers.BooleanField(required=False)
    lastPosition = serializers.IntegerField(min_value=0, required=False)


class AttendanceSerializer(serializers.ModelSerializer):
    courseId = serializers.IntegerField(source="course_id", read_only=True)
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    studentName = serializers.CharField(
        source="student.full_name", read_only=True
    )

    class Meta:
        model = Attendance
        fields = [
            "id",
            "courseId",
            "courseTitle",
            "studentName",
            "sessionDate",
            "checkedInAt",
            "checkedOutAt",
        ]


class AttendanceCourseSerializer(serializers.Serializer):
    courseId = serializers.IntegerField()


# ── Notes & Bookmarks ────────────────────────────────────────────────────────


class NoteSerializer(serializers.ModelSerializer):
    lessonId = serializers.IntegerField(source="lesson_id", read_only=True)
    lessonTitle = serializers.CharField(source="lesson.title", read_only=True)
    sectionTitle = serializers.CharField(
        source="lesson.section.title", read_only=True
    )
    courseId = serializers.IntegerField(
        source="lesson.section.course_id", read_only=True
    )
    courseTitle = serializers.CharField(
        source="lesson.section.course.title", read_only=True
    )

    class Meta:
        model = Note
        fields = [
            "id",
            "lessonId",
            "lessonTitle",
            "sectionTitle",
            "courseId",
            "courseTitle",
            "content",
            "createdAt",
            "updatedAt",
        ]


class NoteCreateSerializer(serializers.Serializer):
    lessonId = serializers.IntegerField()
    content = serializers.CharField()


class NoteUpdateSerializer(serializers.Serializer):
    content = serializers.CharField()


class BookmarkSerializer(serializers.ModelSerializer):
    lessonId = serializers.IntegerField(source="lesson_id", read_only=True)
    lessonTitle = serializers.CharField(source="lesson.title", read_only=True)
    sectionTitle = serializers.CharField(
        source="lesson.section.title", read_only=True
    )
    courseId = serializers.IntegerField(
        source="lesson.section.course_id", read_only=True
    )
    courseTitle = serializers.CharField(
        source="lesson.section.course.title", read_only=True
    )

    class Meta:
        model = Bookmark
        fields = [
            "id",
            "lessonId",
            "lessonTitle",
            "sectionTitle",
            "courseId",
            "courseTitle",
            "createdAt",
        ]


class BookmarkCreateSerializer(serializers.Serializer):
    lessonId = serializers.IntegerField()