from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from notifications.services import notify

from .models import Badge, UserBadge, XpLog

XP_EVENTS = {
    "lesson": 10,
    "quiz": 20,
    "quiz_ace": 15,
    "assignment": 15,
    "assignment_graded": 25,
    "review": 10,
    "discussion": 10,
    "reply": 5,
    "message": 5,
    "badge": 0,  # badge XP comes from the badge's points
}


def add_xp(user, amount, source, description=""):
    if amount <= 0:
        return
    user.xp += amount
    user.save(update_fields=["xp"])
    XpLog.objects.create(
        user=user, amount=amount, source=source, description=description
    )


def register_activity(user, date=None):
    """Roll the daily streak. Returns the new streak value."""
    today = date or timezone.localdate()
    if user.lastActivityDate == today:
        return user.currentStreak
    if user.lastActivityDate == today - timedelta(days=1):
        user.currentStreak += 1
    else:
        user.currentStreak = 1
    if user.currentStreak > user.longestStreak:
        user.longestStreak = user.currentStreak
    user.lastActivityDate = today
    user.save(update_fields=["currentStreak", "longestStreak", "lastActivityDate"])
    return user.currentStreak


def award_badge(user, code):
    badge = Badge.objects.filter(code=code).first()
    if badge is None:
        return None
    _, created = UserBadge.objects.get_or_create(user=user, badge=badge)
    if created:
        if badge.points:
            add_xp(user, badge.points, "badge", f"Badge earned: {badge.name}")
        notify(
            user,
            "achievement",
            f"Badge earned: {badge.name}",
            badge.description,
            link="/gamification",
        )
    return badge


def check_badges(user):
    """Evaluate every rule and award any newly satisfied badges."""
    from courses.models import Review
    from discussions.models import Topic
    from learning.models import LessonProgress, Note
    from messaging.models import Message
    from assessments.models import AssignmentSubmission, Submission

    progress = LessonProgress.objects.filter(
        enrollment__student=user, completed=True
    ).values_list("lesson__section__course_id", flat=True).distinct()
    completed_lessons = LessonProgress.objects.filter(
        enrollment__student=user, completed=True
    ).count()
    if completed_lessons >= 1:
        award_badge(user, "first_lesson")
    if completed_lessons >= 5:
        award_badge(user, "lesson_5")

    for course_id in progress:
        from courses.models import Course

        course = Course.objects.filter(pk=course_id).annotate(
            _lessons=Count("sections__lessons")
        ).first()
        if course is None:
            continue
        done = LessonProgress.objects.filter(
            enrollment__student=user,
            completed=True,
            lesson__section__course_id=course_id,
        ).count()
        if course._lessons == done and course._lessons > 0:
            award_badge(user, "course_complete")

    quiz_done = Submission.objects.filter(
        student=user, status__in=["COMPLETED", "GRADED"]
    )
    if quiz_done.exists():
        award_badge(user, "first_quiz")
    if quiz_done.filter(score__gte=90).exists():
        award_badge(user, "quiz_ace")

    assignment_done = AssignmentSubmission.objects.filter(student=user)
    if assignment_done.exists():
        award_badge(user, "first_assignment")
    if assignment_done.filter(grade__isnull=False).exists():
        award_badge(user, "assignment_graded")

    if Review.objects.filter(student=user).exists():
        award_badge(user, "first_review")
    if Note.objects.filter(student=user).count() >= 3:
        award_badge(user, "notes_3")
    if Topic.objects.filter(author=user).exists():
        award_badge(user, "discussion_talker")
    if Message.objects.filter(sender=user).exists():
        award_badge(user, "messenger")

    streak = user.currentStreak
    if streak >= 3:
        award_badge(user, "streak_3")
    if streak >= 7:
        award_badge(user, "streak_7")
    if streak >= 30:
        award_badge(user, "streak_30")


# ── Event hooks ───────────────────────────────────────────────────────────────


def on_lesson_complete(user):
    add_xp(user, XP_EVENTS["lesson"], "lesson", "Lesson completed")
    register_activity(user)
    check_badges(user)


def on_quiz_submit(user, score=None):
    add_xp(user, XP_EVENTS["quiz"], "quiz", "Quiz submitted")
    if score is not None and score >= 90:
        add_xp(user, XP_EVENTS["quiz_ace"], "quiz", "Quiz Ace bonus (90%+)")
    register_activity(user)
    check_badges(user)


def on_assignment_submit(user):
    add_xp(user, XP_EVENTS["assignment"], "assignment", "Assignment submitted")
    register_activity(user)
    check_badges(user)


def on_assignment_graded(user):
    add_xp(user, XP_EVENTS["assignment_graded"], "assignment", "Assignment graded")
    check_badges(user)


def on_review_created(user):
    add_xp(user, XP_EVENTS["review"], "review", "Review published")
    check_badges(user)


def on_discussion_topic(user):
    add_xp(user, XP_EVENTS["discussion"], "discussion", "Discussion question")
    register_activity(user)
    check_badges(user)


def on_discussion_reply(user):
    add_xp(user, XP_EVENTS["reply"], "reply", "Discussion reply")


def on_message_sent(user):
    add_xp(user, XP_EVENTS["message"], "message", "Message sent")
    check_badges(user)