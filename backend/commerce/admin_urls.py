from django.urls import path

from . import views

app_name = "admin-commerce"

urlpatterns = [
    path("coupons/", views.AdminCouponListView.as_view(), name="admin-coupon-list"),
    path("coupons/<int:pk>/", views.AdminCouponManageView.as_view(), name="admin-coupon-manage"),
]