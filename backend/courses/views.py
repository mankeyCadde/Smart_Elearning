from django.db.models import Count, Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from learning.models import Bookmark, Enrollment, LessonProgress, Note
from notifications.services import notify
from users.permissions import IsAdmin, IsInstructor

from .filters import CourseFilter
from .models import Category, Course, Lesson, Review, Section
from .serializers import (
    CategorySerializer,
    CourseCreateUpdateSerializer,
    CourseDetailSerializer,
    CourseSerializer,
    InstructorReplySerializer,
    LessonSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
    ReviewUpdateSerializer,
    SectionContentSerializer,
    SectionCreateSerializer,
    SectionSerializer,
)
from rest_framework.permissions import AllowAny


class PublicCategoryListView(generics.ListAPIView):
    """Public: list course categories with active courses count."""
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Category.objects.annotate(
                _courses_count=Count(
                    "courses", filter=Q(courses__published=True)
                )
            )
            .filter(_courses_count__gt=0)
            .order_by("-_courses_count")
        )

class CategoryListView(generics.ListCreateAPIView):
    """Instructor/admin: list or create course categories."""

    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get_queryset(self):
        return (
            Category.objects.annotate(
                _courses_count=Count(
                    "courses", filter=Q(courses__published=True)
                )
            ).order_by("name")
        )


# ── Instructor course CRUD ────────────────────────────────────────────────────


class InstructorCourseListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CourseCreateUpdateSerializer
        return CourseSerializer

    def get_queryset(self):
        return (
            Course.objects.filter(instructor=self.request.user)
            .select_related("instructor", "category")
            .annotate(_enrolled_count=Count("enrollments", distinct=True))
            .order_by("-createdAt")
        )

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class InstructorCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CourseCreateUpdateSerializer
        return CourseSerializer

    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user)

    def perform_destroy(self, instance):
        if instance.published:
            raise ValidationError(
                {"detail": "Unpublish the course before deleting it."}
            )
        instance.delete()


# ── Public catalog ────────────────────────────────────────────────────────────


class CourseListView(generics.ListAPIView):
    """Public catalog: list all published courses with filters."""

    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    filterset_class = CourseFilter
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["rating", "reviews", "createdAt", "price"]
    ordering = ["-createdAt"]

    def get_queryset(self):
        return (
            Course.objects.filter(published=True)
            .select_related("instructor", "category")
            .annotate(_enrolled_count=Count("enrollments", distinct=True))
            .order_by("-createdAt")
        )


class CourseDetailView(generics.RetrieveAPIView):
    serializer_class = CourseDetailSerializer
    permission_classes = [AllowAny]
    queryset = (
        Course.objects.filter(published=True)
        .select_related("instructor", "category")
        .annotate(_enrolled_count=Count("enrollments", distinct=True))
        .prefetch_related("sections__lessons")
    )


class CourseContentView(APIView):
    """GET: full course content + the student's progress. Only accessible to
    enrolled students, the course's own instructor, or admins."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        course = get_object_or_404(
            Course, pk=pk, published=True
        )
        user = request.user
        if user.is_admin or (
            user.is_instructor and course.instructor_id == user.id
        ):
            enrollment = None
        else:
            enrollment = Enrollment.objects.filter(
                student=user, course=course
            ).first()
            if not enrollment:
                raise PermissionDenied(
                    "Enroll in this course to access its content."
                )

        sections = course.sections.prefetch_related("lessons")
        progress_map = {}
        if enrollment:
            progress_map = {
                p.lesson_id: p
                for p in enrollment.lesson_progress.select_related("lesson")
            }
        bookmarked_ids = set(
            Bookmark.objects.filter(
                student=user, lesson__section__course_id=course.id
            ).values_list("lesson_id", flat=True)
        )
        note_counts = dict(
            Note.objects.filter(
                student=user, lesson__section__course_id=course.id
            )
            .values_list("lesson_id")
            .annotate(n=Count("id"))
        )
        for section in sections:
            for lesson in section.lessons.all():
                lesson._my_progress = progress_map.get(lesson.id)
                lesson._bookmarked = lesson.id in bookmarked_ids
                lesson._notes_count = note_counts.get(lesson.id, 0)

        return Response(
            {
                "course": CourseSerializer(course).data,
                "sections": SectionContentSerializer(sections, many=True).data,
            }
        )


# ── Curriculum (instructor) ──────────────────────────────────────────────────


def _get_instructor_course(request, course_id):
    return get_object_or_404(
        Course, pk=course_id, instructor=request.user
    )


class CurriculumView(APIView):
    """GET: return all sections (with nested lessons) for a course."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def get(self, request, course_id):
        _get_instructor_course(request, course_id)
        sections = Section.objects.filter(course_id=course_id).prefetch_related(
            "lessons"
        )
        return Response(SectionSerializer(sections, many=True).data)


class SectionCreateView(generics.CreateAPIView):
    serializer_class = SectionCreateSerializer
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def perform_create(self, serializer):
        course = _get_instructor_course(self.request, self.kwargs["course_id"])
        last_order = (
            course.sections.aggregate(m=Max("order"))["m"] or 0
        )
        serializer.save(course=course, order=last_order + 1)


class SectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SectionCreateSerializer
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]
    lookup_url_kwarg = "section_id"

    def get_queryset(self):
        course = _get_instructor_course(self.request, self.kwargs["course_id"])
        return course.sections.all()


class LessonCreateView(generics.CreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def perform_create(self, serializer):
        course = _get_instructor_course(self.request, self.kwargs["course_id"])
        section = get_object_or_404(
            Section, pk=self.kwargs["section_id"], course=course
        )
        last_order = (
            section.lessons.aggregate(m=Max("order"))["m"] or 0
        )
        serializer.save(section=section, order=last_order + 1)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]
    lookup_url_kwarg = "lesson_id"

    def get_queryset(self):
        course = _get_instructor_course(self.request, self.kwargs["course_id"])
        section = get_object_or_404(
            Section, pk=self.kwargs["section_id"], course=course
        )
        return section.lessons.all()


# ── Reviews ───────────────────────────────────────────────────────────────────


def _update_course_rating(course):
    """Recalculate a course's rating snapshot from its reviews."""
    from django.db.models import Avg, Count

    stats = course.reviews_list.aggregate(
        _rating=Avg("rating"), _count=Count("id")
    )
    course.rating = round(stats["_rating"] or 0, 2)
    course.reviews = stats["_count"]
    course.save(update_fields=["rating", "reviews"])


def _public_course_reviews(course_id):
    return (
        Review.objects.filter(course_id=course_id)
        .select_related("student", "course")
    )


class CourseReviewsView(APIView):
    """GET: public list of reviews for a published course.
    POST: enrolled student creates a review (one per course)."""

    permission_classes = [AllowAny]

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id, published=True)
        rating = request.query_params.get("rating")
        reviews = _public_course_reviews(course.id)
        if rating:
            reviews = reviews.filter(rating=rating)
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request, course_id):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied(
                {"detail": "Authentication required to leave a review."}
            )
        course = get_object_or_404(Course, pk=course_id, published=True)
        if not request.user.enrollments.filter(course=course).exists():
            raise PermissionDenied(
                "You must be enrolled in this course to review it."
            )
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review, created = Review.objects.get_or_create(
            student=request.user,
            course=course,
            defaults=dict(serializer.validated_data),
        )
        if not created:
            raise ValidationError(
                {"detail": "You have already reviewed this course."}
            )
        _update_course_rating(course)
        from gamification.services import on_review_created

        on_review_created(request.user)
        return Response(
            ReviewSerializer(
                _public_course_reviews(course.id).get(pk=review.pk)
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ReviewDetailView(APIView):
    """GET: any review. PATCH: the author updates their review.
    DELETE: the author (or an admin) removes a review."""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        review = get_object_or_404(
            Review.objects.select_related("student", "course"), pk=pk
        )
        return Response(ReviewSerializer(review).data)

    def patch(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied("Authentication required.")
        review = get_object_or_404(Review, pk=pk, student=request.user)
        serializer = ReviewUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(review, field, value)
        review.save()
        if "rating" in serializer.validated_data:
            _update_course_rating(review.course)
        return Response(ReviewSerializer(review).data)

    def delete(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied("Authentication required.")
        review = get_object_or_404(
            Review.objects.select_related("course"), pk=pk
        )
        if not (
            request.user == review.student or request.user.is_admin
        ):
            raise PermissionDenied(
                "You can only delete your own review."
            )
        course = review.course
        review.delete()
        _update_course_rating(course)
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstructorReviewReplyView(APIView):
    """POST: the course's instructor (or admin) replies to a review."""

    permission_classes = [IsAuthenticated, IsInstructor | IsAdmin]

    def post(self, request, pk):
        review = get_object_or_404(
            Review.objects.select_related("course", "student"), pk=pk
        )
        if not request.user.is_admin and (
            review.course.instructor_id != request.user.id
        ):
            raise PermissionDenied("You do not teach this course.")
        serializer = InstructorReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review.instructorReply = serializer.validated_data["reply"]
        review.instructorReplyAt = timezone.now()
        review.save(update_fields=["instructorReply", "instructorReplyAt"])
        notify(
            review.student,
            "review",
            "The instructor replied to your review",
            f"{request.user.full_name} replied to your rating of "
            f"'{review.course.title}'.",
            link=f"/course/{review.course_id}",
        )
        return Response(ReviewSerializer(review).data)

# ── Admin course management ───────────────────────────────────────────────────


class AdminCourseListView(APIView):
    """GET: all courses across the platform, with enrollment totals."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = (
            Course.objects.select_related("instructor", "category")
            .annotate(
                _enrolled_count=Count("enrollments", distinct=True),
                _sections_count=Count("sections", distinct=True),
            )
            .order_by("-createdAt")
        )
        published = request.query_params.get("published")
        if published in ("true", "false"):
            qs = qs.filter(published=published == "true")
        search = (request.query_params.get("q") or "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(instructor__email__icontains=search)
            )
        return Response(CourseSerializer(qs, many=True).data)


class AdminCourseManageView(APIView):
    """PATCH course fields (publish/unpublish) / DELETE (admin)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        serializer = CourseCreateUpdateSerializer(
            course, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return Response(CourseSerializer(course).data)

    def delete(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if course.published:
            raise ValidationError(
                {"detail": "Unpublish the course before deleting it."}
            )
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
