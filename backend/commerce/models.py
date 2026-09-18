from django.conf import settings
from django.db import models

from courses.models import Course


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "PERCENT", "Percent"
        FIXED = "FIXED", "Fixed"

    code = models.CharField(max_length=50, unique=True)
    discountType = models.CharField(
        max_length=10, choices=DiscountType.choices, default=DiscountType.PERCENT
    )
    value = models.DecimalField(max_digits=10, decimal_places=2)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="coupons",
        null=True,
        blank=True,
        help_text="Leave empty to apply this coupon to every course.",
    )
    expiresAt = models.DateTimeField(null=True, blank=True)
    maxUses = models.PositiveIntegerField(default=0, help_text="0 = unlimited uses")
    usedCount = models.PositiveIntegerField(default=0)
    isActive = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-createdAt"]
        db_table = "commerce_coupon"

    def save(self, *args, **kwargs):
        self.code = (self.code or "").strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.code

    def is_valid_for(self, course, now=None):
        from django.utils import timezone

        now = now or timezone.now()
        if not self.isActive:
            return False
        if self.expiresAt is not None and self.expiresAt < now:
            return False
        if self.course_id and self.course_id != course.id:
            return False
        if self.maxUses and self.usedCount >= self.maxUses:
            return False
        return True

    def discount_amount(self, subtotal):
        if not subtotal or subtotal <= 0:
            return 0
        if self.discountType == self.DiscountType.PERCENT:
            if self.value >= 100:
                return subtotal
            return (subtotal * self.value) / 100
        return min(self.value, subtotal)


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        REFUNDED = "REFUNDED", "Refunded"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="orders"
    )
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-createdAt"]
        db_table = "commerce_order"

    def __str__(self):
        return f"#{self.pk} {self.student} → {self.course}"