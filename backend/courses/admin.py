from django.contrib import admin

from .models import Category, Course, Lesson, Review, Section


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "icon")
    search_fields = ("name",)


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    ordering = ("order",)


class SectionInline(admin.StackedInline):
    model = Section
    extra = 0
    ordering = ("order",)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "instructor", "category", "level", "published", "rating", "createdAt")
    list_filter = ("published", "level", "category")
    search_fields = ("title", "instructor__email")
    inlines = [SectionInline]


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "section", "type", "duration", "order")
    list_filter = ("type",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "rating", "createdAt", "instructorReplyAt")
    list_filter = ("rating", "course")
    search_fields = ("student__email", "course__title")