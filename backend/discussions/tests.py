from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Course, Lesson, Section
from learning.models import Enrollment
from users.models import User

from .models import Topic


class DiscussionAccessTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="discussion-owner@test.com",
            password="P@ssword1234!",
            role="INSTRUCTOR",
        )
        self.pending = User.objects.create_user(
            email="discussion-pending@test.com", password="P@ssword1234!"
        )
        self.accepted = User.objects.create_user(
            email="discussion-accepted@test.com", password="P@ssword1234!"
        )
        self.rejected = User.objects.create_user(
            email="discussion-rejected@test.com", password="P@ssword1234!"
        )
        self.course = Course.objects.create(
            title="Discussion Course",
            instructor=self.instructor,
            published=True,
        )
        self.section = Section.objects.create(
            title="Section", order=1, course=self.course
        )
        self.lesson = Lesson.objects.create(
            title="Lesson", order=1, section=self.section, type="TEXT"
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
        self.topic = Topic.objects.create(
            author=self.instructor, lesson=self.lesson, body="Question"
        )

    def test_topic_access_requires_accepted_enrollment(self):
        url = reverse(
            "discussions:topic-list", args=[self.lesson.id]
        )
        for user in (self.pending, self.rejected):
            self.client.force_authenticate(user=user)
            self.assertEqual(
                self.client.get(url).status_code,
                status.HTTP_403_FORBIDDEN,
            )

        self.client.force_authenticate(user=self.accepted)
        self.assertEqual(
            self.client.get(url).status_code, status.HTTP_200_OK
        )

    def test_posting_reply_requires_accepted_enrollment(self):
        url = reverse(
            "discussions:reply-create", args=[self.topic.id]
        )
        for user in (self.pending, self.rejected):
            self.client.force_authenticate(user=user)
            response = self.client.post(url, {"body": "Reply"}, format="json")
            self.assertEqual(
                response.status_code, status.HTTP_403_FORBIDDEN
            )

        self.client.force_authenticate(user=self.accepted)
        response = self.client.post(url, {"body": "Reply"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
