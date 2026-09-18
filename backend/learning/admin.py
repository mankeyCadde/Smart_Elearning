from django.contrib import admin

from .models import Attendance, Bookmark, Enrollment, LessonProgress, Note


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "price", "enrolledAt", "completedAt")
    list_filter = ("course", "enrolledAt")
    search_fields = ("student__email", "course__title")


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("enrollment", "lesson", "completed", "lastPosition", "updatedAt")
    list_filter = ("completed", "lesson__type")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "sessionDate", "checkedInAt", "checkedOutAt")
    list_filter = ("course", "sessionDate")
    search_fields = ("student__email", "course__title")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("student", "lesson", "createdAt", "updatedAt")
    search_fields = ("student__email", "lesson__title")


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("student", "lesson", "createdAt")
    search_fields = ("student__email", "lesson__title")