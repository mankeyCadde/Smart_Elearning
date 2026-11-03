from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Course
from learning.models import Enrollment
from users.models import User

from .models import Order


class PaidEnrollmentFlowTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="commerce-owner@test.com",
            password="P@ssword1234!",
            role="INSTRUCTOR",
        )
        self.student = User.objects.create_user(
            email="commerce-student@test.com", password="P@ssword1234!"
        )
        self.free_course = Course.objects.create(
            title="Free Course",
            instructor=self.instructor,
            price=0,
            published=True,
        )
        self.paid_course = Course.objects.create(
            title="Paid Course",
            instructor=self.instructor,
            price=50,
            published=True,
        )

    def test_paid_course_direct_enrollment_is_rejected(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("learning:enroll"),
            {"courseId": self.paid_course.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            Enrollment.objects.filter(
                student=self.student, course=self.paid_course
            ).exists()
        )

    @override_settings(PAYMENTS_DEMO_MODE=False)
    def test_paid_checkout_is_unavailable_without_provider(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("commerce:order-create"),
            {"courseId": self.paid_course.id},
            format="json",
        )
        self.assertEqual(
            response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE
        )
        self.assertEqual(Order.objects.count(), 0)
        self.assertFalse(
            Enrollment.objects.filter(
                student=self.student, course=self.paid_course
            ).exists()
        )

    @override_settings(PAYMENTS_DEMO_MODE=True)
    def test_demo_checkout_creates_accepted_enrollment(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("commerce:order-create"),
            {"courseId": self.paid_course.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(student=self.student, course=self.paid_course)
        self.assertEqual(order.status, Order.Status.COMPLETED)
        enrollment = Enrollment.objects.get(
            student=self.student, course=self.paid_course
        )
        self.assertEqual(enrollment.status, Enrollment.Status.ACCEPTED)
        self.assertEqual(enrollment.price, self.paid_course.price)

    def test_free_course_does_not_use_checkout(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("commerce:order-create"),
            {"courseId": self.free_course.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
