import os
import subprocess
import sys

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
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

    @override_settings(FRONTEND_BASE_URL="https://app.example.com")
    def test_forgot_password_uses_frontend_base_url(self):
        """The reset email must use the configured frontend URL, not localhost."""
        User.objects.create_user(email="reset@test.com", password="P@ssword1234!")
        url = reverse("users:forgot_password")
        response = self.client.post(
            url, {"email": "reset@test.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        self.assertIn("https://app.example.com/reset-password?uid=", body)
        self.assertNotIn("localhost", body)

    def test_forgot_password_uses_configured_from_address(self):
        """Reset emails use the configured production sender address."""
        User.objects.create_user(
            email="reset-from@test.com", password="P@ssword1234!"
        )
        with override_settings(DEFAULT_FROM_EMAIL="security@example.com"):
            response = self.client.post(
                reverse("users:forgot_password"),
                {"email": "reset-from@test.com"},
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].from_email, "security@example.com")

    def test_production_rejects_console_email_backend(self):
        """Production settings refuse to write reset tokens to console logs."""
        env = os.environ.copy()
        env.update(
            {
                "DJANGO_DEBUG": "False",
                "DJANGO_SECRET_KEY": "test-production-secret-key",
                "DJANGO_ALLOWED_HOSTS": "api.example.com",
                "FRONTEND_BASE_URL": "https://app.example.com",
                "EMAIL_BACKEND": (
                    "django.core.mail.backends.console.EmailBackend"
                ),
            }
        )
        env.pop("EMAIL_HOST", None)
        result = subprocess.run(
            [sys.executable, "-c", "import config.settings"],
            cwd=str(settings.BASE_DIR),
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("EMAIL_BACKEND", result.stderr)

    def test_reset_password_flow(self):
        """A valid uid + token sets a new password."""
        user = User.objects.create_user(
            email="reset2@test.com", password="P@ssword1234!"
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        url = reverse("users:reset_password")
        response = self.client.post(
            url,
            {"uid": uid, "token": token, "newPassword": "N3wP@ssword123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        user.refresh_from_db()
        self.assertTrue(user.check_password("N3wP@ssword123!"))

    def test_reset_password_rejects_bad_token(self):
        """An invalid token must not change the password."""
        user = User.objects.create_user(
            email="reset3@test.com", password="P@ssword1234!"
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        url = reverse("users:reset_password")
        response = self.client.post(
            url,
            {"uid": uid, "token": "not-a-real-token", "newPassword": "N3wP@ssword123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user.refresh_from_db()
        self.assertTrue(user.check_password("P@ssword1234!"))

    def test_logout_blacklists_refresh_token(self):
        """Logout blacklists the refresh token so it can no longer be used."""
        user = User.objects.create_user(
            email="logout@test.com", password="P@ssword1234!"
        )
        login = self.client.post(
            reverse("users:token_obtain_pair"),
            {"email": "logout@test.com", "password": "P@ssword1234!"},
            format="json",
        )
        refresh = login.data["refresh"]
        self.client.force_authenticate(user=user)
        logout = self.client.post(
            reverse("users:logout"), {"refresh": refresh}, format="json"
        )
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)

        fresh = APIClient()
        reuse = fresh.post(
            reverse("users:token_refresh"), {"refresh": refresh}, format="json"
        )
        self.assertEqual(reuse.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_cannot_access_admin_endpoints(self):
        """A student is forbidden from admin-only user management."""
        student = User.objects.create_user(
            email="student-admin@test.com", password="P@ssword1234!"
        )
        self.client.force_authenticate(user=student)
        response = self.client.get(reverse("users:admin-user-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
