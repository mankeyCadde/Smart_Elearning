from rest_framework import serializers

from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    courseId = serializers.IntegerField(source="course_id", read_only=True)
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    instructorName = serializers.CharField(
        source="course.instructor.full_name", read_only=True
    )
    studentFullName = serializers.CharField(
        source="student.full_name", read_only=True
    )

    class Meta:
        model = Certificate
        fields = [
            "id",
            "certificateCode",
            "courseId",
            "courseTitle",
            "instructorName",
            "studentFullName",
            "issuedAt",
            "earnedAt",
        ]


class CertificateVerifySerializer(serializers.ModelSerializer):
    courseTitle = serializers.CharField(source="course.title", read_only=True)
    instructorName = serializers.CharField(
        source="course.instructor.full_name", read_only=True
    )
    studentFullName = serializers.CharField(
        source="student.full_name", read_only=True
    )

    class Meta:
        model = Certificate
        fields = [
            "certificateCode",
            "courseTitle",
            "instructorName",
            "studentFullName",
            "issuedAt",
            "earnedAt",
        ]