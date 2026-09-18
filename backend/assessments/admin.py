from django.contrib import admin

from .models import (
    AnswerOption,
    Assignment,
    AssignmentSubmission,
    Question,
    Quiz,
    Submission,
    SubmissionAnswer,
)


class AnswerOptionInline(admin.TabularInline):
    model = AnswerOption
    extra = 1


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "published", "timeLimitMinutes", "maxAttempts", "dueDate")
    list_filter = ("published", "course")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("quiz", "text", "questionType", "points", "order")
    list_filter = ("questionType", "quiz")
    inlines = [AnswerOptionInline]


@admin.register(AnswerOption)
class AnswerOptionAdmin(admin.ModelAdmin):
    list_display = ("question", "text", "isCorrect", "order")
    list_filter = ("isCorrect",)


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "quiz", "attemptNumber", "status", "score", "startedAt")
    list_filter = ("status", "quiz")
    search_fields = ("student__email", "quiz__title")


@admin.register(SubmissionAnswer)
class SubmissionAnswerAdmin(admin.ModelAdmin):
    list_display = ("submission", "question", "selectedOption", "isCorrect", "pointsAwarded")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "points", "dueDate", "published")
    list_filter = ("published", "course")


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "submittedAt", "grade", "gradedAt")
    list_filter = ("gradedAt", "assignment")
    search_fields = ("student__email", "assignment__title")