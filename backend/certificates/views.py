from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Certificate
from .serializers import CertificateSerializer, CertificateVerifySerializer


class MyCertificatesView(APIView):
    """GET: authenticated student's certificates."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        certificates = (
            Certificate.objects.filter(student=request.user)
            .select_related("course", "course__instructor")
        )
        return Response(CertificateSerializer(certificates, many=True).data)


class CertificateDetailView(APIView):
    """GET one of the authenticated student's certificates."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        certificate = get_object_or_404(
            Certificate.objects.select_related(
                "course", "course__instructor"
            ),
            pk=pk,
            student=request.user,
        )
        return Response(CertificateSerializer(certificate).data)


class CertificateVerifyView(APIView):
    """GET: public certificate verification by code (no auth required)."""

    permission_classes = [AllowAny]

    def get(self, request, code):
        certificate = get_object_or_404(
            Certificate.objects.select_related(
                "course", "course__instructor", "student"
            ),
            certificateCode=code,
        )
        return Response(CertificateVerifySerializer(certificate).data)