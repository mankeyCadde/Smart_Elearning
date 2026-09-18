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
        Enrollment.objects.create(student=self.student, course=self.course)
        
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
        enrollment = Enrollment.objects.create(student=self.student, course=self.course)
        # Create initial progress
        LessonProgress.objects.create(enrollment=enrollment, lesson=self.lesson)
        
        url = reverse("learning:lesson-progress", args=[self.lesson.id])
        data = {"completed": True, "lastPosition": 120}
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        progress = LessonProgress.objects.get(enrollment=enrollment, lesson=self.lesson)
        self.assertTrue(progress.completed)
        self.assertEqual(progress.lastPosition, 120)
