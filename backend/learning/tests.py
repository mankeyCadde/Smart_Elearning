from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User
from courses.models import Course, Section, Lesson
from learning.models import Enrollment, Note, Bookmark, LessonProgress

class LearningTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(email="student@test.com", password="P@ssword1234!", role="STUDENT")
        self.instructor = User.objects.create_user(email="instructor@test.com", password="P@ssword1234!", role="INSTRUCTOR")
        
        self.course = Course.objects.create(title="Test Course", description="A test course", instructor=self.instructor, price=0, published=True)
        self.section = Section.objects.create(title="Section 1", order=1, course=self.course)
        self.lesson = Lesson.objects.create(title="Lesson 1", order=1, section=self.section, type="VIDEO", youtubeId="xyz")
        
    def test_enroll_in_course(self):
        """Test that a student can enroll in a course."""
        self.client.force_authenticate(user=self.student)
        url = reverse("learning:enroll")
        response = self.client.post(url, {"courseId": self.course.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Enrollment.objects.count(), 1)
        
    def test_create_and_delete_note(self):
        """Test note creation and deletion."""
        self.client.force_authenticate(user=self.student)
        # Enrollment required to take notes typically, or maybe not structurally, but let's enroll first.
        Enrollment.objects.create(
            student=self.student,
            course=self.course,
            status=Enrollment.Status.ACCEPTED,
        )
        
        url = reverse("learning:note-list")
        response = self.client.post(url, {"lessonId": self.lesson.id, "content": "My Note"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Note.objects.count(), 1)
        note_id = response.data["id"]
        
        detail_url = reverse("learning:note-detail", args=[note_id])
        del_response = self.client.delete(detail_url)
        self.assertEqual(del_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Note.objects.count(), 0)

    def test_create_and_delete_bookmark(self):
        """Test bookmark creation and deletion."""
        self.client.force_authenticate(user=self.student)
        Enrollment.objects.create(
            student=self.student,
            course=self.course,
            status=Enrollment.Status.ACCEPTED,
        )
        url = reverse("learning:bookmark-list")
        response = self.client.post(url, {"lessonId": self.lesson.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bookmark.objects.count(), 1)
        bookmark_id = response.data["id"]
        
        detail_url = reverse("learning:bookmark-detail", args=[bookmark_id])
        del_response = self.client.delete(detail_url)
        self.assertEqual(del_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Bookmark.objects.count(), 0)

    def test_lesson_progress(self):
        """Test updating lesson progress."""
        self.client.force_authenticate(user=self.student)
        enrollment = Enrollment.objects.create(
            student=self.student,
            course=self.course,
            status=Enrollment.Status.ACCEPTED,
        )
        # Create initial progress
        LessonProgress.objects.create(enrollment=enrollment, lesson=self.lesson)
        
        url = reverse("learning:lesson-progress", args=[self.lesson.id])
        data = {"completed": True, "lastPosition": 120}
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        progress = LessonProgress.objects.get(enrollment=enrollment, lesson=self.lesson)
        self.assertTrue(progress.completed)
        self.assertEqual(progress.lastPosition, 120)


class EnrollmentAccessTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="owner@test.com",
            password="P@ssword1234!",
            role="INSTRUCTOR",
        )
        self.pending = User.objects.create_user(
            email="pending@test.com", password="P@ssword1234!"
        )
        self.accepted = User.objects.create_user(
            email="accepted@test.com", password="P@ssword1234!"
        )
        self.rejected = User.objects.create_user(
            email="rejected@test.com", password="P@ssword1234!"
        )
        self.course = Course.objects.create(
            title="Access Course",
            instructor=self.instructor,
            price=0,
            published=True,
        )
        self.section = Section.objects.create(
            title="Section", order=1, course=self.course
        )
        self.lesson = Lesson.objects.create(
            title="Lesson",
            order=1,
            section=self.section,
            type="VIDEO",
            youtubeId="abc123",
        )
        Enrollment.objects.create(
            student=self.pending,
            course=self.course,
            status=Enrollment.Status.PENDING,
        )
        Enrollment.objects.create(
            student=self.accepted,
            course=self.course,
            status=Enrollment.Status.ACCEPTED,
        )
        Enrollment.objects.create(
            student=self.rejected,
            course=self.course,
            status=Enrollment.Status.REJECTED,
        )

    def test_course_content_requires_accepted_enrollment(self):
        url = reverse("courses:course-content", args=[self.course.id])
        for user in (self.pending, self.rejected):
            self.client.force_authenticate(user=user)
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.accepted)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_notes_and_bookmarks_require_accepted_enrollment(self):
        note_url = reverse("learning:note-list")
        bookmark_url = reverse("learning:bookmark-list")
        payload = {"lessonId": self.lesson.id, "content": "Note"}

        for user in (self.pending, self.rejected):
            self.client.force_authenticate(user=user)
            note_response = self.client.post(note_url, payload, format="json")
            bookmark_response = self.client.post(
                bookmark_url, {"lessonId": self.lesson.id}, format="json"
            )
            self.assertEqual(
                note_response.status_code, status.HTTP_403_FORBIDDEN
            )
            self.assertEqual(
                bookmark_response.status_code, status.HTTP_403_FORBIDDEN
            )

        self.client.force_authenticate(user=self.accepted)
        note_response = self.client.post(note_url, payload, format="json")
        bookmark_response = self.client.post(
            bookmark_url, {"lessonId": self.lesson.id}, format="json"
        )
        self.assertEqual(note_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(bookmark_response.status_code, status.HTTP_201_CREATED)

    def test_paid_course_direct_enrollment_is_rejected(self):
        self.course.price = 50
        self.course.save(update_fields=["price"])
        buyer = User.objects.create_user(
            email="buyer@test.com", password="P@ssword1234!"
        )
        url = reverse("learning:enroll")
        self.client.force_authenticate(user=buyer)
        response = self.client.post(
            url, {"courseId": self.course.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            Enrollment.objects.filter(student=buyer).exists()
        )
