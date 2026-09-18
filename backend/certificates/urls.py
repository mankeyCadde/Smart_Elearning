from django.urls import path

from . import views

app_name = "certificates"

urlpatterns = [
    path("certificates/verify/<str:code>/", views.CertificateVerifyView.as_view(), name="certificate-verify"),
    path("certificates/", views.MyCertificatesView.as_view(), name="certificates"),
    path("certificates/<int:pk>/", views.CertificateDetailView.as_view(), name="certificate-detail"),
]