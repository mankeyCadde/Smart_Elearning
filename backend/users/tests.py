from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User

class UserTests(APITestCase):
    def test_create_user(self):
        """Test creating a standard student user."""
        user = User.objects.create_user(email="student@test.com", password="P@ssword1234!")
        self.assertEqual(user.email, "student@test.com")
        self.assertTrue(user.is_student)
        self.assertFalse(user.is_staff)

    def test_create_superuser(self):
        """Test creating a superuser admin."""
        admin = User.objects.create_superuser(email="admin@test.com", password="P@ssword1234!")
        self.assertTrue(admin.is_admin)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_registration_api(self):
        """Test the registration endpoint."""
        url = reverse("users:register")
        data = {
            "fullName": "Test Student",
            "email": "newstudent@test.com",
            "password": "P@ssword1234!",
            "role": "STUDENT"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, "newstudent@test.com")

    def test_login_api(self):
        """Test the login endpoint returns JWT tokens."""
        User.objects.create_user(email="login@test.com", password="P@ssword1234!")
        url = reverse("users:token_obtain_pair")
        data = {
            "email": "login@test.com",
            "password": "P@ssword1234!"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
