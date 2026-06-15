"""
Test-only settings override.
Uses SQLite in-memory so tests run without a MySQL server.

Run with:
    python manage.py test --settings=LivestockIQ.test_settings
"""
from LivestockIQ.settings import *  # noqa: F401, F403

# ── Database ──────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# ── Speed ─────────────────────────────────────────────────────────────────────
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ── Celery ─────────────────────────────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ── Media ─────────────────────────────────────────────────────────────────────
import tempfile
MEDIA_ROOT = tempfile.mkdtemp()

# ── Disable REST throttling during tests ──────────────────────────────────────
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []   # noqa: F405
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}     # noqa: F405
