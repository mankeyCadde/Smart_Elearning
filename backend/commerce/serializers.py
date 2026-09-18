from decimal import Decimal, InvalidOperation

from rest_framework import serializers

from courses.models import Course

from .models import Coupon, Order


def parse_decimal(value):
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError, ValueError):
        raise serializers.ValidationError("Enter a valid number.")


class CouponSerializer(serializers.ModelSerializer):
    courseId = serializers.PrimaryKeyRelatedField(
        source="course",
        queryset=Course.objects.all(),
        required=False,
        allow_null=True,
    )
    courseTitle = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "discountType",
            "value",
            "courseId",
            "courseTitle",
            "expiresAt",
            "maxUses",
            "usedCount",
            "isActive",
            "createdAt",
        ]

    def validate_value(self, value):
        if Decimal(value) < 0:
            raise serializers.ValidationError("Value cannot be negative.")
        return value


class CouponCheckSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    courseId = serializers.IntegerField()


class OrderSerializer(serializers.ModelSerializer):
    courseId = serializers.IntegerField(source="course_id", read_only=True)
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    couponCode = serializers.CharField(source="coupon.code", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "courseId",
            "courseTitle",
            "couponCode",
            "subtotal",
            "discount",
            "total",
            "status",
            "createdAt",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["subtotal"] = parse_decimal(data["subtotal"])
        data["discount"] = parse_decimal(data["discount"])
        data["total"] = parse_decimal(data["total"])
        return data


class OrderCreateSerializer(serializers.Serializer):
    courseId = serializers.IntegerField()
    couponCode = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")