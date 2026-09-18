from django.contrib import admin

from .models import Coupon, Order


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "discountType",
        "value",
        "course",
        "expiresAt",
        "maxUses",
        "usedCount",
        "isActive",
    ]
    list_filter = ["discountType", "isActive"]
    search_fields = ["code"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "course",
        "subtotal",
        "discount",
        "total",
        "status",
        "coupon",
        "createdAt",
    ]
    list_filter = ["status"]
    search_fields = ["student__email", "course__title"]
    readonly_fields = ["createdAt"]