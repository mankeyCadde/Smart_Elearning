from django.contrib import admin

from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = [
        "certificateCode",
        "student",
        "course",
        "issuedAt",
        "earnedAt",
    ]
    list_filter = ["issuedAt", "earnedAt"]
    search_fields = ["certificateCode", "student__email", "course__title"]
    readonly_fields = ["certificateCode", "issuedAt"]