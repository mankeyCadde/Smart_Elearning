from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course
from learning.models import Enrollment
from users.permissions import IsAdmin

from .models import Coupon, Order
from .serializers import (
    CouponCheckSerializer,
    CouponSerializer,
    OrderCreateSerializer,
    OrderSerializer,
)


def _get_coupon(code):
    return Coupon.objects.select_related("course").filter(
        code=(code or "").strip().upper()
    ).first()


# ── Student-facing ───────────────────────────────────────────────────────────


class CouponValidateView(APIView):
    """POST {code, courseId}: validate a coupon and return the price breakdown."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CouponCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = get_object_or_404(
            Course, pk=serializer.validated_data["courseId"], published=True
        )
        coupon = _get_coupon(serializer.validated_data["code"])
        if not coupon or not coupon.is_valid_for(course):
            raise ValidationError({"detail": "This coupon is invalid or expired."})

        subtotal = course.price
        discount = coupon.discount_amount(subtotal)
        return Response(
            {
                "code": coupon.code,
                "discountType": coupon.discountType,
                "value": coupon.value,
                "subtotal": subtotal,
                "discount": discount,
                "total": subtotal - discount,
            }
        )


class OrderCreateView(APIView):
    """POST {courseId, couponCode?}: pay for and enroll in a published course.

    Simulates a (mock) payment: on success the order is marked COMPLETED and
    the student is enrolled. The price recorded on the enrollment is the net
    amount paid (after any coupon discount).
    """

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = get_object_or_404(
            Course,
            pk=serializer.validated_data["courseId"],
            published=True,
        )
        if request.user.enrollments.filter(course=course).exists():
            raise ValidationError(
                {"detail": "You are already enrolled in this course."}
            )

        subtotal = course.price
        coupon = None
        discount = 0
        code = serializer.validated_data.get("couponCode") or ""
        if code:
            coupon = _get_coupon(code)
            if not coupon or not coupon.is_valid_for(course):
                raise ValidationError({"detail": "This coupon is invalid or expired."})
            discount = coupon.discount_amount(subtotal)
            coupon.usedCount += 1
            coupon.save(update_fields=["usedCount"])

        total = subtotal - discount
        order = Order.objects.create(
            student=request.user,
            course=course,
            coupon=coupon,
            subtotal=subtotal,
            discount=discount,
            total=total,
            status=Order.Status.COMPLETED,
        )
        Enrollment.objects.create(
            student=request.user, course=course, price=total
        )
        from notifications.services import notify

        notify(
            request.user,
            "course",
            "Purchase successful",
            f"You are now enrolled in '{course.title}'.",
            link=f"/course/{course.id}",
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class MyOrdersView(APIView):
    """GET: authenticated student's order history."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(student=request.user).select_related(
            "course", "coupon"
        )
        return Response(OrderSerializer(orders, many=True).data)


# ── Admin ────────────────────────────────────────────────────────────────────


class AdminCouponListView(APIView):
    """GET list (?q= search) / POST create coupons."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Coupon.objects.select_related("course").all()
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(Q(code__icontains=q) | Q(course__title__icontains=q))
        return Response(CouponSerializer(qs, many=True).data)

    def post(self, request):
        serializer = CouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.save()
        return Response(
            CouponSerializer(coupon).data, status=status.HTTP_201_CREATED
        )


class AdminCouponManageView(APIView):
    """GET/PATCH/DELETE a coupon (admin only)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def _get_coupon(self, pk):
        return get_object_or_404(Coupon.objects.select_related("course"), pk=pk)

    def get(self, request, pk):
        return Response(CouponSerializer(self._get_coupon(pk)).data)

    def patch(self, request, pk):
        coupon = self._get_coupon(pk)
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CouponSerializer(coupon).data)

    def delete(self, request, pk):
        coupon = self._get_coupon(pk)
        coupon.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)