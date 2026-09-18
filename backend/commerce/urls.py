from django.urls import path

from . import views

app_name = "commerce"

urlpatterns = [
    path("coupons/validate/", views.CouponValidateView.as_view(), name="coupon-validate"),
    path("orders/", views.OrderCreateView.as_view(), name="order-create"),
    path("orders/mine/", views.MyOrdersView.as_view(), name="orders-mine"),
]