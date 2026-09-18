from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from users.models import User
from courses.models import Category, Course, Section, Lesson
from learning.models import Enrollment, LessonProgress
from assessments.models import AnswerOption, Question, Quiz, Submission, SubmissionAnswer
from courses.models import Category, Course, Lesson, Review, Section


class Command(BaseCommand):
    help = "Seed demo categories, instructor user, and sample course with sections/lessons."

    def handle(self, *args, **options):
        # ── categories ────────────────────────────────────────────────────
        categories = {
            "Web Development": ("#3B82F6", "laptop", "Frontend and backend web technologies"),
            "Data Science": ("#10B981", "chart", "Data analysis, ML, and AI"),
            "Mobile Development": ("#F59E0B", "smartphone", "iOS and Android app development"),
            "UX Design": ("#EF4444", "palette", "User experience and interface design"),
            "Cloud Computing": ("#8B5CF6", "cloud", "AWS, Azure, and cloud infrastructure"),
        }
        cats = {}
        for name, (color, icon, desc) in categories.items():
            obj, _ = Category.objects.get_or_create(
                name=name, defaults={"color": color, "icon": icon, "description": desc}
            )
            cats[name] = obj
        self.stdout.write(f"  Categories: {Category.objects.count()}")

        # ── instructor user ───────────────────────────────────────────────
        instructor, _ = User.objects.get_or_create(
            email="instructor@test.com",
            defaults={
                "first_name": "Alice",
                "last_name": "Johnson",
                "role": "INSTRUCTOR",
                "is_staff": True,
            },
        )
        instructor.set_password("InstructorPass1")
        instructor.is_active = True
        instructor.role = "INSTRUCTOR"
        instructor.save(update_fields=["password", "is_active", "role"])
        self.stdout.write(f"  Instructor: {instructor.email}")

        # ── student user ──────────────────────────────────────────────────
        student, _ = User.objects.get_or_create(
            email="student@test.com",
            defaults={
                "first_name": "Bob",
                "last_name": "Smith",
                "role": "STUDENT",
            },
        )
        student.set_password("StudentPass1")
        student.is_active = True
        student.role = "STUDENT"
        student.save(update_fields=["password", "is_active", "role"])
        self.stdout.write(f"  Student: {student.email}")

        # ── courses ───────────────────────────────────────────────────────
        courses_data = [
            {
                "title": "Complete Python Bootcamp",
                "description": "Learn Python from scratch with hands-on projects and real-world examples.",
                "category": cats["Data Science"],
                "price": 49.99,
                "image": "https://api.dicebear.com/7.x/shapes/svg?seed=python&backgroundColor=b6e3f4",
                "level": "BEGINNER",
                "published": True,
                "rating": 4.80,
                "reviews": 3421,
            },
            {
                "title": "Advanced React & Next.js",
                "description": "Build production-grade React apps with hooks, context, and Next.js.",
                "category": cats["Web Development"],
                "price": 79.99,
                "image": "https://api.dicebear.com/7.x/shapes/svg?seed=react&backgroundColor=c0aede",
                "level": "ADVANCED",
                "published": True,
                "rating": 4.90,
                "reviews": 1204,
            },
            {
                "title": "Flutter Mobile Development",
                "description": "Create beautiful cross-platform mobile apps with Flutter and Dart.",
                "category": cats["Mobile Development"],
                "price": 0,
                "image": "https://api.dicebear.com/7.x/shapes/svg?seed=flutter&backgroundColor=d1d4f9",
                "level": "BEGINNER",
                "published": True,
                "rating": 4.70,
                "reviews": 890,
            },
            {
                "title": "AWS Cloud Practitioner",
                "description": "Prepare for the AWS Cloud Practitioner certification.",
                "category": cats["Cloud Computing"],
                "price": 99.99,
                "image": "https://api.dicebear.com/7.x/shapes/svg?seed=aws&backgroundColor=ffdfbf",
                "level": "INTERMEDIATE",
                "published": False,
                "rating": 0,
                "reviews": 0,
            },
        ]
        for data in courses_data:
            obj, created = Course.objects.get_or_create(
                title=data["title"],
                defaults={**data, "instructor": instructor},
            )
            if created:
                self.stdout.write(f"    Course created: {obj.title}")

        # ── sections + lessons for first course ───────────────────────────
        python_course = Course.objects.get(title="Complete Python Bootcamp")
        sections_data = [
            {
                "title": "Getting Started",
                "lessons": [
                    ("Introduction to Python", "TEXT", 600, "Python is a versatile programming language..."),
                    ("Installing Python", "VIDEO", 900, "https://www.youtube.com/watch?v=YYXdXT2l-Gg"),
                    ("Your First Program", "VIDEO", 1200, "https://www.youtube.com/watch?v=kqtD5dpn9C8"),
                ],
            },
            {
                "title": "Variables and Data Types",
                "lessons": [
                    ("Variables in Python", "TEXT", 480, "Variables store data values..."),
                    ("Number Types", "VIDEO", 720, "https://www.youtube.com/watch?v=qlb66vl4kXs"),
                    ("Strings Deep Dive", "VIDEO", 1080, "https://www.youtube.com/watch?v=k9TUPpGqCTo"),
                    ("Type Conversion Quiz", "QUIZ", 600, ""),
                ],
            },
            {
                "title": "Control Flow",
                "lessons": [
                    ("If Statements", "TEXT", 540, "Conditional execution in Python..."),
                    ("For Loops", "VIDEO", 840, "https://www.youtube.com/watch?v=94UHCEmprCY"),
                    ("While Loops", "VIDEO", 780, "https://www.youtube.com/watch?v=6tNS--WetLI"),
                    ("Build a Calculator", "ASSIGNMENT", 1800, "Build a simple calculator that handles +, -, *, /"),
                ],
            },
        ]
        for s_idx, sec in enumerate(sections_data, 1):
            section, _ = Section.objects.get_or_create(
                course=python_course,
                order=s_idx,
                defaults={"title": sec["title"]},
            )
            for l_idx, (title, ltype, dur, content) in enumerate(sec["lessons"], 1):
                Lesson.objects.get_or_create(
                    section=section,
                    order=l_idx,
                    defaults={
                        "title": title,
                        "type": ltype,
                        "duration": dur,
                        "content": content,
                    },
                )
        self.stdout.write(f"  Sections: {Section.objects.count()}, Lessons: {Lesson.objects.count()}")

        # ── enrollment + progress for demo student ─────────────────────────
        python_course = Course.objects.get(title="Complete Python Bootcamp")
        enrollment, _ = Enrollment.objects.get_or_create(
            student=student,
            course=python_course,
            defaults={"price": python_course.price},
        )
        lessons = list(
            Lesson.objects.filter(section__course=python_course).order_by(
                "section__order", "order"
            )[:4]
        )
        for idx, lesson in enumerate(lessons):
            is_done = idx < 3
            LessonProgress.objects.get_or_create(
                enrollment=enrollment,
                lesson=lesson,
                defaults={
                    "completed": is_done,
                    "completedAt": timezone.now() if is_done else None,
                    "lastPosition": lesson.duration if is_done else 120,
                },
            )
        self.stdout.write(
            f"  Enrollment: {student.email} → {python_course.title}"
        )

        # ── quizzes + demo submission for the Python course ───────────────
        quiz, _ = Quiz.objects.get_or_create(
            course=python_course,
            title="Python Fundamentals Quiz",
            defaults={
                "description": "Test your basics: functions, typing, and data structures.",
                "timeLimitMinutes": 10,
                "passingScore": 60.00,
                "maxAttempts": 3,
                "published": True,
            },
        )
        questions_data = [
            {
                "order": 1,
                "text": "Which keyword is used to define a function in Python?",
                "questionType": "MC",
                "points": 1,
                "options": [
                    ("func", False),
                    ("define", False),
                    ("def", True),
                    ("function", False),
                ],
            },
            {
                "order": 2,
                "text": "Python is a statically typed language.",
                "questionType": "TF",
                "points": 1,
                "options": [
                    ("True", True),
                    ("False", False),
                ],
            },
            {
                "order": 3,
                "text": "Explain the difference between a list and a tuple in Python.",
                "questionType": "SA",
                "points": 2,
                "options": [],
            },
        ]
        question_map = {}
        for q_data in questions_data:
            q, _ = Question.objects.get_or_create(
                quiz=quiz,
                order=q_data["order"],
                defaults={
                    "text": q_data["text"],
                    "questionType": q_data["questionType"],
                    "points": q_data["points"],
                },
            )
            question_map[q.order] = q
            for o_idx, (text, is_correct) in enumerate(q_data["options"], 1):
                AnswerOption.objects.get_or_create(
                    question=q,
                    order=o_idx,
                    defaults={"text": text, "isCorrect": is_correct},
                )
        self.stdout.write(f"  Quiz: {quiz.title} (3 questions, published)")

        submission, created = Submission.objects.get_or_create(
            student=student,
            quiz=quiz,
            attemptNumber=1,
            defaults={
                "status": Submission.Status.COMPLETED,
                "score": Decimal("50.00"),
                "completedAt": timezone.now(),
            },
        )
        if created:
            q1 = question_map[1]
            q2 = question_map[2]
            q3 = question_map[3]
            correct1 = q1.options.get(isCorrect=True)
            correct2 = q2.options.get(isCorrect=True)
            SubmissionAnswer.objects.get_or_create(
                submission=submission,
                question=q1,
                defaults={
                    "selectedOption": correct1,
                    "isCorrect": True,
                    "pointsAwarded": Decimal("1"),
                },
            )
            SubmissionAnswer.objects.get_or_create(
                submission=submission,
                question=q2,
                defaults={
                    "selectedOption": correct2,
                    "isCorrect": True,
                    "pointsAwarded": Decimal("1"),
                },
            )
            SubmissionAnswer.objects.get_or_create(
                submission=submission,
                question=q3,
                defaults={
                    "textAnswer": (
                        "Lists are mutable and can be changed after creation. "
                        "Tuples are immutable."
                    ),
                    "isCorrect": None,
                    "pointsAwarded": Decimal("0"),
                },
            )
            self.stdout.write(
                f"    Demo submission (attempt 1, score 50.00, SA pending grading)"
            )

        # ── demo review from Bob with an instructor reply ─────────────────
        review, created = Review.objects.get_or_create(
            student=student,
            course=python_course,
            defaults={
                "rating": 5,
                "title": "Perfect course to start with",
                "comment": (
                    "Explanations are clear and the projects make concepts "
                    "stick. Highly recommended for beginners!"
                ),
                "instructorReply": (
                    "Thank you, Bob! Happy to have you on board."
                ),
                "instructorReplyAt": timezone.now(),
            },
        )
        self.stdout.write(f"  Review: {student.email} → {python_course.title} (5★)")

        # keep the course rating snapshot consistent with real reviews
        from django.db.models import Avg, Count

        stats = python_course.reviews_list.aggregate(
            _rating=Avg("rating"), _count=Count("id")
        )
        if stats["_count"]:
            python_course.rating = round(stats["_rating"], 2)
            python_course.reviews = stats["_count"]
            python_course.save(update_fields=["rating", "reviews"])

        # ── demo assignment for the Python course ──────────────────────────
        from assessments.models import Assignment

        assignment, created = Assignment.objects.get_or_create(
            course=python_course,
            title="Build a Python Calculator",
            defaults={
                "description": (
                    "Write a command-line calculator that supports +, -, *, / "
                    "and handles division by zero gracefully. Submit your "
                    "script and a short explanation of your approach."
                ),
                "dueDate": timezone.now() + timezone.timedelta(days=7),
                "points": 20,
                "published": True,
            },
        )
        self.stdout.write(f"  Assignment: {assignment.title} ({assignment.points} pts)")

        # ── demo discussion thread on lesson 1 ─────────────────────────────
        from discussions.models import Reply, Topic

        first_lesson = python_course.sections.order_by("order").first().lessons.order_by("order").first()
        topic, _ = Topic.objects.get_or_create(
            lesson=first_lesson,
            body="Hey everyone! Where should I focus my practice for the week 1 quiz?",
            defaults={"author": student},
        )
        reply, _ = Reply.objects.get_or_create(
            topic=topic,
            body="Definitely revisit the variables and loops lessons — and try the calculator assignment!",
            defaults={"author": instructor},
        )
        self.stdout.write(f"  Discussion: topic on '{first_lesson.title}' with {topic.replies.count()} reply(s)")

        # ── demo 1:1 chat between Bob and Alice ────────────────────────────
        from messaging.models import Conversation, Message

        conversation, conv_created = Conversation.for_pair(
            student, instructor
        )
        Message.objects.get_or_create(
            conversation=conversation,
            sender=student,
            body="Hi Alice! I had a question about the week 2 project setup.",
        )
        Message.objects.get_or_create(
            conversation=conversation,
            sender=instructor,
            body="Hi Bob! Setup is covered in lesson 3 — but happy to help if you get stuck.",
            defaults={"isRead": True},
        )
        self.stdout.write(f"  Chat: Bob ↔ Alice ({conversation.messages.count()} messages)")

        # ── demo notifications for Bob ─────────────────────────────────────
        from notifications.models import Notification

        Notification.objects.get_or_create(
            user=student,
            type=Notification.Type.SYSTEM,
            title="Welcome to SmartLearn!",
            defaults={
                "message": "Thanks for joining our learning platform. "
                "Pick a course and start your journey!",
            },
        )
        Notification.objects.get_or_create(
            user=student,
            type=Notification.Type.ASSIGNMENT,
            title="Assignment graded",
            message=f"Your submission for '{assignment.title}' is ready for review.",
        )
        Notification.objects.get_or_create(
            user=student,
            type=Notification.Type.DISCUSSION,
            title="New reply on your question",
            message="Alice Johnson replied to your discussion question.",
        )
        self.stdout.write(f"  Notifications: {student.email} has {student.notifications.count()}")

        # ── award badges for existing demo activity ────────────────────────
        from gamification.services import check_badges

        for u in (student, instructor):
            check_badges(u)
            self.stdout.write(
                f"  Gamification: {u.full_name} -> {u.user_badges.count()} badges, "
                f"{u.xp} XP"
            )

        self.stdout.write(self.style.SUCCESS("Done."))