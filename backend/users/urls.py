from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminUserListView,
    AdminUserManageView,
    ChangePasswordView,
    CustomTokenObtainPairView,
    ForgotPasswordView,
    LogoutView,
    MeView,
    RegisterView,
    ResetPasswordView,
)

app_name = "users"

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    # ── Admin user management ─────────────────────────────────────────────
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:pk>/", AdminUserManageView.as_view(), name="admin-user-manage"),
]