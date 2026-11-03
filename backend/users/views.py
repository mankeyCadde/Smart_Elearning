from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .permissions import IsAdmin
from .serializers import (
    AdminUserCreateUpdateSerializer,
    AdminUserSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    """Public self-registration. Student by default; instructor only via
    `?role=instructor`. Any other role value is rejected, so users can never
    self-register as ADMIN."""

    permission_classes = [AllowAny]

    def post(self, request):
        requested_role = (request.query_params.get("role") or "").strip().lower()
        if requested_role not in ("", "student", "instructor"):
            raise ValidationError(
                {"role": "Role must be either 'student' or 'instructor'."}
            )

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role = (
            User.Role.INSTRUCTOR
            if requested_role == "instructor"
            else User.Role.STUDENT
        )

        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            first_name=data["firstName"],
            last_name=data["lastName"],
            role=role,
        )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds the full user profile to the login response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Blacklists the provided refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            raise ValidationError({"refresh": "This field is required."})
        try:
            RefreshToken(refresh).blacklist()
        except TokenError as exc:
            raise ValidationError({"refresh": str(exc)})
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET my profile / PATCH to update my own profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = ProfileUpdateSerializer

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = self.serializer_class(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data["currentPassword"]):
            raise ValidationError({"currentPassword": "Current password is incorrect."})
        if (
            serializer.validated_data["newPassword"]
            == serializer.validated_data["currentPassword"]
        ):
            raise ValidationError(
                {"newPassword": "New password must be different from the current one."}
            )

        user.set_password(serializer.validated_data["newPassword"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully."})


class ForgotPasswordView(APIView):
    """Emails a password reset link (developer build) based on the user's email."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "If that email exists, a reset link has been sent."}
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = (
            f"{settings.FRONTEND_BASE_URL}/reset-password?uid={uid}&token={token}"
        )
        send_mail(
            "Reset your SmartLearn password",
            f"Follow this link to reset your password:\n\n{link}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        return Response({"detail": "If that email exists, a reset link has been sent."})


class ResetPasswordView(APIView):
    """Verifies uid + token from the reset link and sets a new password."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(data["uid"])))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise ValidationError({"token": "Invalid or expired reset link."})

        if not default_token_generator.check_token(user, data["token"]):
            raise ValidationError({"token": "Invalid or expired reset link."})

        user.set_password(data["newPassword"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successful."})


class AdminUserListView(APIView):
    """GET list (with role/search filters) / POST create a user (admin)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from django.db.models import Count

        qs = User.objects.annotate(
            _enrollments_count=Count("enrollments", distinct=True),
            _courses_count=Count("courses", distinct=True),
        )
        role = request.query_params.get("role")
        if role in User.Role.values:
            qs = qs.filter(role=role)
        search = (request.query_params.get("q") or "").strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )
        qs = qs.order_by("-date_joined")
        return Response(AdminUserSerializer(qs, many=True).data)

    def post(self, request):
        serializer = AdminUserCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserManageView(APIView):
    """PATCH (role, active, profile) / DELETE a user (admin)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def _get_user(self, pk):
        return get_object_or_404(User, pk=pk)

    def patch(self, request, pk):
        user = self._get_user(pk)
        if user.pk == request.user.pk and request.data.get("isActive") is False:
            raise ValidationError({"detail": "You cannot deactivate your own account."})
        if user.pk == request.user.pk and "role" in request.data and request.data.get("role") != User.Role.ADMIN:
            raise ValidationError({"detail": "You cannot change your own role."})
        serializer = AdminUserCreateUpdateSerializer(
            user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data)

    def delete(self, request, pk):
        user = self._get_user(pk)
        if user.pk == request.user.pk:
            raise PermissionDenied("You cannot delete your own account.")
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)