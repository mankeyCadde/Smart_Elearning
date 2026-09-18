from django.core.management.base import BaseCommand

from gamification.models import Badge

CATALOG = [
    ("first_lesson", "First Steps", "Complete your first lesson.", "🚀", "learning", 15),
    ("lesson_5", "Halfway There", "Complete 5 lessons.", "🎯", "learning", 20),
    ("first_quiz", "Quiz Apprentice", "Submit your first quiz.", "📝", "learning", 20),
    ("quiz_ace", "Quiz Ace", "Score 90% or higher on any quiz.", "💯", "learning", 25),
    ("first_assignment", "Task Starter", "Submit your first assignment.", "📤", "learning", 20),
    ("assignment_graded", "On the Record", "Get your first assignment graded.", "✅", "learning", 20),
    ("course_complete", "Course Finisher", "Complete every lesson in a course.", "🎓", "achievement", 50),
    ("streak_3", "On Fire", "Keep a 3-day learning streak.", "🔥", "achievement", 25),
    ("streak_7", "Unstoppable", "Keep a 7-day learning streak.", "⚡", "achievement", 35),
    ("streak_30", "Iron Will", "Keep a 30-day learning streak.", "🧠", "achievement", 75),
    ("first_review", "Community Voice", "Leave your first course review.", "💬", "engagement", 10),
    ("notes_3", "Note-Taker", "Create 3 personal notes.", "📒", "engagement", 10),
    ("discussion_talker", "Curious Mind", "Ask your first discussion question.", "❓", "engagement", 10),
    ("messenger", "Connected", "Send your first direct message.", "✉️", "engagement", 5),
]


class Command(BaseCommand):
    help = "Seed the gamification badge catalog."

    def handle(self, *args, **options):
        for code, name, description, icon, category, points in CATALOG:
            badge, created = Badge.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "icon": icon,
                    "category": category,
                    "points": points,
                },
            )
            self.stdout.write(f"  {'+' if created else '='} {badge.name} ({badge.code})")
        self.stdout.write(self.style.SUCCESS(f"Done. {Badge.objects.count()} badges."))