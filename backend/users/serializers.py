from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Read-only public profile of a user, exposed with camelCase keys."""

    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    fullName = serializers.CharField(source="full_name", read_only=True)
    dateJoined = serializers.DateTimeField(source="date_joined", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "firstName",
            "lastName",
            "fullName",
            "phone",
            "bio",
            "avatar",
            "role",
            "dateJoined",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin-facing user record with activity counters."""

    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    fullName = serializers.CharField(source="full_name", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    dateJoined = serializers.DateTimeField(source="date_joined", read_only=True)
    enrollmentsCount = serializers.SerializerMethodField()
    coursesCount = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "firstName",
            "lastName",
            "fullName",
            "phone",
            "bio",
            "avatar",
            "role",
            "isActive",
            "dateJoined",
            "xp",
            "enrollmentsCount",
            "coursesCount",
        ]

    def get_enrollmentsCount(self, obj):
        return getattr(obj, "_enrollments_count", 0)

    def get_coursesCount(self, obj):
        return getattr(obj, "_courses_count", 0)


class AdminUserCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/update a user (admin workspace)."""

    password = serializers.CharField(required=False, allow_blank=True)
    firstName = serializers.CharField(source="first_name", required=False, allow_blank=True)
    lastName = serializers.CharField(source="last_name", required=False, allow_blank=True)
    isActive = serializers.BooleanField(source="is_active", required=False)

    class Meta:
        model = User
        fields = [
            "email",
            "firstName",
            "lastName",
            "phone",
            "bio",
            "avatar",
            "role",
            "isActive",
            "password",
        ]

    def validate_password(self, value):
        if value:
            from django.contrib.auth.password_validation import validate_password

            validate_password(value)
        return value

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class RegisterSerializer(serializers.Serializer):
    """Public self-registration. Never accepts a role from the body; the
    view decides the role from the ?role=instructor query parameter."""

    fullName = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    firstName = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    lastName = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    email = serializers.EmailField(trim_whitespace=True)
    password = serializers.CharField(trim_whitespace=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value

    def validate(self, attrs):
        first = (attrs.get("firstName") or "").strip()
        last = (attrs.get("lastName") or "").strip()
        full = (attrs.get("fullName") or "").strip()
        if full:
            parts = full.split(None, 1)
            first = parts[0]
            last = parts[1] if len(parts) > 1 else ""
        if not first:
            raise serializers.ValidationError({"fullName": "Full name is required."})
        attrs["firstName"] = first
        attrs["lastName"] = last
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Update an authenticated user's own profile."""

    firstName = serializers.CharField(source="first_name", required=False, allow_blank=True)
    lastName = serializers.CharField(source="last_name", required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["firstName", "lastName", "email", "phone", "bio", "avatar"]

    def validate_email(self, value):
        owner = self.instance
        if owner and User.objects.exclude(pk=owner.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(trim_whitespace=False)
    newPassword = serializers.CharField(trim_whitespace=False)

    def validate_newPassword(self, value):
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    newPassword = serializers.CharField(trim_whitespace=False)

    def validate_newPassword(self, value):
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value