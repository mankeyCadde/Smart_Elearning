from django.core.management.base import BaseCommand

from commerce.models import Coupon

SEED = [
    {"code": "SAVE20", "discountType": "PERCENT", "value": "20.00", "course": None, "expiresAt": None, "maxUses": 0},
    {"code": "WELCOME10", "discountType": "FIXED", "value": "10.00", "course": None, "expiresAt": None, "maxUses": 0},
    {"code": "BOOTCAMP5", "discountType": "FIXED", "value": "5.00", "course": 1, "expiresAt": None, "maxUses": 0},
]


class Command(BaseCommand):
    help = "Seed demo coupon codes for the commerce module."

    def handle(self, *args, **options):
        created = 0
        for item in SEED:
            course_id = item["course"]
            data = {k: v for k, v in item.items() if k != "course"}
            coupon, was_created = Coupon.objects.update_or_create(
                code=item["code"],
                defaults={**data, "course_id": course_id, "isActive": True},
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Coupons ready ({created} newly created)."))