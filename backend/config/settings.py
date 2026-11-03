
"""
Django settings for SmartLearn backend.
"""

import os
from pathlib import Path
from datetime import timedelta

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

# Load a local, git-ignored .env if present. In production, configuration is
# supplied through real environment variables (e.g. Render's dashboard), which
# always take precedence because load_dotenv does not override existing values.
load_dotenv(BASE_DIR / ".env")


def _env_bool(name, default=False):
    """Return a boolean from an environment variable (accepts 1/true/yes/on)."""
    return os.environ.get(name, str(default)).strip().lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


def _env_list(name, default=""):
    """Return a comma-separated environment variable as a clean list."""
    return [
        item.strip()
        for item in os.environ.get(name, default).split(",")
        if item.strip()
    ]


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

# Safe production default: DEBUG must be explicitly enabled for local work.
DEBUG = _env_bool("DJANGO_DEBUG", False)

# SECRET_KEY must be supplied externally in production. A clearly-marked,
# development-only fallback is used solely when DEBUG is enabled.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "django-insecure-local-dev-only-do-not-use-in-production"
    else:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY must be set to a strong, unique value in production."
        )

# Explicit hostnames only. Wildcards are never used as a production fallback.
ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    if DEBUG:
        ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"]
    else:
        raise ImproperlyConfigured(
            "DJANGO_ALLOWED_HOSTS must be set to a comma-separated list of "
            "explicit production hostnames (e.g. api.example.com)."
        )

# ---------------------------------------------------------------------------
# Installed apps
# ---------------------------------------------------------------------------

INSTALLED_APPS = [
    # Django built-ins
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",

    # SmartLearn apps
    "users",
    "courses",
    "learning",
    "assessments",
    "analytics",
    "discussions",
    "messaging",
    "notifications",
    "gamification",
    "commerce",
    "certificates",
]

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ---------------------------------------------------------------------------
# URL / Templates
# ---------------------------------------------------------------------------

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
# Database — SQLite only
# ---------------------------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---------------------------------------------------------------------------
# Custom User Model
# ---------------------------------------------------------------------------

AUTH_USER_MODEL = "users.User"

# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        )
    },
]

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise serves collected static files directly from the WSGI app, which is
# what makes the Django admin usable in production without a separate web server
# or CDN. CompressedManifestStaticFilesStorage adds cache-busting filenames and
# gzip/brotli compression.
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ---------------------------------------------------------------------------
# Media files
# ---------------------------------------------------------------------------

MEDIA_URL = "media/"
_media_root = os.environ.get("DJANGO_MEDIA_ROOT", "").strip()
MEDIA_ROOT = (
    Path(_media_root).expanduser() if _media_root else BASE_DIR / "media"
)

_media_storage_backend = os.environ.get(
    "DJANGO_MEDIA_STORAGE_BACKEND", ""
).strip()
if _media_storage_backend:
    STORAGES["default"] = {"BACKEND": _media_storage_backend}

AWS_STORAGE_BUCKET_NAME = os.environ.get(
    "AWS_STORAGE_BUCKET_NAME", ""
).strip()
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "").strip()
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", "").strip()
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "").strip()
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
AWS_QUERYSTRING_AUTH = True
AWS_DEFAULT_ACL = None
AWS_S3_FILE_OVERWRITE = False

FILE_UPLOAD_PERMISSIONS = 0o600
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o700

ASSIGNMENT_MAX_UPLOAD_BYTES = int(
    os.environ.get("ASSIGNMENT_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))
)
ASSIGNMENT_ALLOWED_FILE_EXTENSIONS = _env_list(
    "ASSIGNMENT_ALLOWED_FILE_EXTENSIONS",
    (
        "pdf,doc,docx,ppt,pptx,xls,xlsx,csv,txt,rtf,odt,ods,odp,"
        "zip,png,jpg,jpeg,gif,webp"
    ),
)
ASSIGNMENT_ALLOWED_CONTENT_TYPES = _env_list(
    "ASSIGNMENT_ALLOWED_CONTENT_TYPES",
    (
        "application/pdf,application/msword,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
        "application/vnd.ms-powerpoint,"
        "application/vnd.openxmlformats-officedocument.presentationml.presentation,"
        "application/vnd.ms-excel,"
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"
        "text/csv,text/plain,application/rtf,"
        "application/vnd.oasis.opendocument.text,"
        "application/vnd.oasis.opendocument.spreadsheet,"
        "application/vnd.oasis.opendocument.presentation,"
        "application/zip,image/png,image/jpeg,image/gif,image/webp"
    ),
)

# ---------------------------------------------------------------------------
# Default primary key field type
# ---------------------------------------------------------------------------

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

# In development fall back to the local React dev-server origins; in production
# the actual frontend origin(s) must be supplied explicitly.
_dev_origins = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:5174,"
    "http://127.0.0.1:5174"
)

CORS_ALLOWED_ORIGINS = _env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    _dev_origins if DEBUG else "",
)

CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins are required for session-authenticated requests (e.g.
# Django admin) made from a different origin. The JSON API itself is JWT-based
# and does not use CSRF-protected cookies, but admin/staff POSTs still do.
CSRF_TRUSTED_ORIGINS = _env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    _dev_origins if DEBUG else "",
)

# ---------------------------------------------------------------------------
# Frontend base URL (used to build links emailed to users, e.g. password reset)
# ---------------------------------------------------------------------------

FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "").strip().rstrip("/")
if not FRONTEND_BASE_URL:
    if DEBUG:
        FRONTEND_BASE_URL = "http://localhost:5173"
    elif CORS_ALLOWED_ORIGINS:
        FRONTEND_BASE_URL = CORS_ALLOWED_ORIGINS[0].rstrip("/")
    else:
        raise ImproperlyConfigured(
            "FRONTEND_BASE_URL must be set to the deployed frontend origin."
        )
if not FRONTEND_BASE_URL.startswith(("http://", "https://")):
    raise ImproperlyConfigured(
        "FRONTEND_BASE_URL must be an absolute URL including the http(s) scheme."
    )

# ---------------------------------------------------------------------------
# Production security (only enforced when DEBUG is off)
# ---------------------------------------------------------------------------

if not DEBUG:
    # Redirect all plain HTTP requests to HTTPS.
    SECURE_SSL_REDIRECT = _env_bool("DJANGO_SECURE_SSL_REDIRECT", True)

    # Cookies are only sent over HTTPS.
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HTTP Strict Transport Security: 1 year, subdomains included.
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = False

    # Render (and similar PaaS) terminate TLS at their proxy and forward the
    # original scheme in X-Forwarded-Proto. Only trust it when the platform
    # actually does this (the default on Render); a host that terminates TLS
    # itself should set DJANGO_TRUST_PROXY_SSL=false.
    if _env_bool("DJANGO_TRUST_PROXY_SSL", True):
        SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Render's internal health-check probe hits the app over plain HTTP, so the
    # health endpoint must not be redirected to HTTPS (otherwise the probe sees
    # a 301 and the deploy is marked unhealthy).
    SECURE_REDIRECT_EXEMPT = [r"^api/health/$"]

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": (
        "rest_framework.schemas.openapi.AutoSchema"
    ),
}

# ---------------------------------------------------------------------------
# Simple JWT
# ---------------------------------------------------------------------------

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": (
        "rest_framework_simplejwt.tokens.AccessToken",
    ),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": (
        "rest_framework_simplejwt.serializers.TokenObtainPairSerializer"
    ),
}

# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

PAYMENTS_DEMO_MODE = _env_bool("PAYMENTS_DEMO_MODE", DEBUG)
if PAYMENTS_DEMO_MODE and not DEBUG:
    raise ImproperlyConfigured(
        "PAYMENTS_DEMO_MODE cannot be enabled while DEBUG is False. Paid "
        "courses require a verified payment provider before launch."
    )

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------

EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", "").strip()
if not EMAIL_BACKEND:
    EMAIL_BACKEND = (
        "django.core.mail.backends.console.EmailBackend"
        if DEBUG
        else "django.core.mail.backends.smtp.EmailBackend"
    )

if not DEBUG and "console" in EMAIL_BACKEND.lower():
    raise ImproperlyConfigured(
        "Production EMAIL_BACKEND must not be the console backend because it "
        "writes password-reset tokens to logs."
    )

EMAIL_HOST = os.environ.get("EMAIL_HOST", "").strip()
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = _env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = _env_bool("EMAIL_USE_SSL", False)
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "10"))
DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL", "noreply@smartlearn.local"
).strip()
SERVER_EMAIL = DEFAULT_FROM_EMAIL

if EMAIL_USE_TLS and EMAIL_USE_SSL:
    raise ImproperlyConfigured(
        "EMAIL_USE_TLS and EMAIL_USE_SSL cannot both be enabled."
    )

if (
    not DEBUG
    and EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
    and not EMAIL_HOST
):
    raise ImproperlyConfigured(
        "EMAIL_HOST must be set when using the SMTP email backend in production."
    )
