"""
Django settings for LivestockIQ API project.
Refactored for REST API with JWT authentication.
"""

from pathlib import Path
import os 
from datetime import timedelta
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv() 

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-%t34=t8#0fl#tckjutucn5t4a$*ihp(j-$9w958%)gusv4(ys&')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    
    # Local apps
    'accounts',
    'animals',
    'environment',
    'health',
    'alerts',
    'costs',
    'farms',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # For static files in production
    'corsheaders.middleware.CorsMiddleware',  # CORS - must be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'LivestockIQ.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'LivestockIQ.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'livestockIQ'),
        'USER': os.environ.get('DB_USER', 'saad'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '1234'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = []
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (User uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==============================================================================
# REST FRAMEWORK CONFIGURATION
# ==============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # Error handling
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    # Datetime format
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    'DATE_FORMAT': '%Y-%m-%d',
}

# ==============================================================================
# JWT CONFIGURATION
# ==============================================================================

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# ==============================================================================
# CORS CONFIGURATION
# ==============================================================================

# CORS settings for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# For production, use environment variable
if not DEBUG:
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ==============================================================================
# API DOCUMENTATION (drf-spectacular)
# ==============================================================================

SPECTACULAR_SETTINGS = {
    'TITLE': 'LivestockIQ API',
    'DESCRIPTION': 'AI-powered livestock management system API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# ==============================================================================
# CUSTOM SETTINGS
# ==============================================================================

# External API Keys
API_KEYS = {
    'OPENWEATHERMAP': os.environ.get('OPENWEATHERMAP_KEY'),
    'GOOGLE_MAPS':    os.environ.get('GOOGLE_MAPS_API_KEY'),
}

# File upload settings
MAX_UPLOAD_SIZE = 5242880  # 5MB

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'


CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Set to False for sync (demo), True for async (production)
USE_CELERY = False  # Change to True when Redis is running
# USE_CELERY = True  # Change to True when Redis is running

# Celery Beat — periodic alert tasks
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Runs daily at 08:00 UTC — checks overdue & upcoming vaccinations
    'check-vaccination-schedules-daily': {
        'task': 'alerts.tasks.check_vaccination_schedules',
        'schedule': crontab(hour=8, minute=0),
    },
    # Runs every hour — checks farm weather for extreme conditions
    'check-environmental-conditions-hourly': {
        'task': 'alerts.tasks.check_environmental_conditions',
        'schedule': crontab(minute=0),
    },
    # Runs every 15 minutes — scans input folders for disease/lameness detection
    'auto-scan-folders': {
        'task': 'alerts.tasks.auto_scan_folders',
        'schedule': crontab(minute='*/15'),
    },
}

# ==============================================================================
# AUTO-SCAN SETTINGS
# ==============================================================================
# Root folder for the background detection scanner.
# Expected layout:
#   AUTO_SCAN_INPUT_IMAGES  → drop images here to scan for disease
#   AUTO_SCAN_INPUT_VIDEOS  → drop videos here to scan for lameness
#   AUTO_SCAN_OUTPUT_DIR    → detected files are copied here (dated sub-folders)
AUTO_SCAN_INPUT_IMAGES       = os.path.join(BASE_DIR, 'auto_scan', 'input', 'images')
AUTO_SCAN_INPUT_VIDEOS       = os.path.join(BASE_DIR, 'auto_scan', 'input', 'videos')
AUTO_SCAN_OUTPUT_DIR         = os.path.join(BASE_DIR, 'auto_scan', 'output', 'detected')
AUTO_SCAN_DISEASE_THRESHOLD  = float(os.environ.get('AUTO_SCAN_DISEASE_THRESHOLD',  '0.60'))
AUTO_SCAN_LAMENESS_THRESHOLD = float(os.environ.get('AUTO_SCAN_LAMENESS_THRESHOLD', '0.60'))

# ==============================================================================
# EMAIL CONFIGURATION
# ==============================================================================
# Default: console backend (prints to terminal). Switch to smtp for production.
# Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend in .env
EMAIL_BACKEND      = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST         = os.environ.get('EMAIL_HOST',         'smtp.gmail.com')
EMAIL_PORT         = int(os.environ.get('EMAIL_PORT',     '587'))
EMAIL_USE_TLS      = os.environ.get('EMAIL_USE_TLS',      'True') == 'True'
EMAIL_HOST_USER    = os.environ.get('EMAIL_HOST_USER',    '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'LivestockIQ <noreply@livestockiq.com>')
# When set, ALL alert emails are redirected here instead of the real user address.
# Clear this variable in production.
EMAIL_TEST_RECIPIENT = os.environ.get('EMAIL_TEST_RECIPIENT', '')

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# Used to build absolute media URLs when a request object is not available
DJANGO_BASE_URL = os.environ.get('DJANGO_BASE_URL', 'http://localhost:8000')