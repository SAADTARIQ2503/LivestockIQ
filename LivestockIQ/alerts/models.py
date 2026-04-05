from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings as django_settings
from animals.models import Animal


class Detection(models.Model):
    """
    AI Disease Detection Results
    """
    DISEASE_CHOICES = [
        ('healthy', 'Healthy'),
        ('foot-and-mouth', 'Foot and Mouth Disease'),
        ('lumpy', 'Lumpy Skin Disease'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='detections')
    animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True, 
                              related_name='detections')
    image = models.ImageField(upload_to='detections/%Y/%m/%d/', null=True, blank=True)
    video = models.FileField(upload_to='detections/videos/%Y/%m/%d/', null=True, blank=True)
    
    predicted_disease = models.CharField(max_length=50, choices=DISEASE_CHOICES)
    confidence = models.FloatField(help_text="Confidence score (0.0 to 1.0)")
    all_probabilities = models.JSONField(null=True, blank=True, 
                                        help_text="All disease probabilities")
    
    model_used = models.CharField(max_length=100, default='vit_fold_1')
    processing_time = models.FloatField(null=True, blank=True, help_text="Seconds")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Detection'
        verbose_name_plural = 'Detections'
    
    def __str__(self):
        return f"{self.predicted_disease} - {self.confidence:.2%} ({self.created_at.strftime('%Y-%m-%d')})"


class Alert(models.Model):
    """
    System Alerts
    """
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Info'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts')
    title = models.CharField(max_length=255)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='info')
    
    animal = models.ForeignKey(Animal, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='alerts')
    detection = models.ForeignKey(Detection, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='alerts')
    lameness_detection = models.ForeignKey('health.LamenessDetection', on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='alerts')
    
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Alert'
        verbose_name_plural = 'Alerts'
    
    def __str__(self):
        return f"{self.severity.upper()}: {self.title}"


# ─────────────────────────────────────────────────────────────────────────────
# Specialized alert hierarchy
# ─────────────────────────────────────────────────────────────────────────────

class BaseAlert(models.Model):
    """
    Abstract base class for all specialized alert types.
    Provides common fields plus email notification and system-ping helpers.
    Inheriting models: EnvironmentalAlert, VaccinationAlert, HealthAlert.
    """
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('warning',  'Warning'),
        ('info',     'Info'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    title      = models.CharField(max_length=255)
    message    = models.TextField()
    severity   = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='info')
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    email_sent  = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def send_email_notification(self):
        """
        Send an email alert.
        If EMAIL_TEST_RECIPIENT is set in settings, all emails go there
        instead of the real user address (useful during development/testing).
        """
        if not self.user.email:
            return False

        test_recipient = getattr(django_settings, 'EMAIL_TEST_RECIPIENT', None)
        recipient = test_recipient if test_recipient else self.user.email

        subject = f"[LivestockIQ] {self.severity.upper()}: {self.title}"
        body = (
            f"{self.message}\n\n"
            f"---\n"
            f"Severity : {self.severity.upper()}\n"
            f"Created  : {self.created_at}\n"
            + (f"Original recipient: {self.user.email}\n" if test_recipient else "")
            + f"\nThis is an automated alert from LivestockIQ.\n"
            f"Log in to your dashboard to take action."
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            self.email_sent = True
            self.save(update_fields=['email_sent'])
            return True
        except Exception:
            return False

    def ping_system(self):
        """
        Create a generic Alert entry so this alert surfaces in the main
        in-app alert feed (polled by the frontend every 30-60 s).
        Only creates a new entry if no active alert with this title exists.
        """
        if not Alert.objects.filter(
            user=self.user,
            title=self.title,
            is_resolved=False,
        ).exists():
            Alert.objects.create(
                user=self.user,
                title=self.title,
                message=self.message,
                severity=self.severity,
            )

    def resolve(self):
        """Mark this alert as resolved with a timestamp."""
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save(update_fields=['is_resolved', 'resolved_at'])


class EnvironmentalAlert(BaseAlert):
    """Persisted weather/environment alert generated from OpenWeatherMap data."""
    CONDITION_CHOICES = [
        ('heat_stress',   'Heat Stress'),
        ('cold_stress',   'Cold Stress'),
        ('high_humidity', 'High Humidity'),
        ('strong_wind',   'Strong Wind'),
    ]

    condition_type = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    temperature    = models.FloatField(null=True, blank=True)
    humidity       = models.FloatField(null=True, blank=True)
    wind_speed     = models.FloatField(null=True, blank=True)
    location       = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Environmental Alert'
        verbose_name_plural = 'Environmental Alerts'

    def __str__(self):
        return f"ENV [{self.severity.upper()}]: {self.title}"


class VaccinationAlert(BaseAlert):
    """Alert for an upcoming or overdue vaccination schedule."""
    ALERT_TYPE_CHOICES = [
        ('upcoming',  'Upcoming'),
        ('due_today', 'Due Today'),
        ('overdue',   'Overdue'),
    ]

    schedule       = models.ForeignKey('health.VaccinationSchedule', on_delete=models.CASCADE,
                                       related_name='vaccination_alerts')
    alert_type     = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    days_until_due = models.IntegerField(default=0)   # negative value means N days overdue

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Vaccination Alert'
        verbose_name_plural = 'Vaccination Alerts'

    def __str__(self):
        return f"VAX [{self.severity.upper()}]: {self.title}"


class HealthAlert(BaseAlert):
    """Alert raised by AI disease detection or lameness detection."""
    ALERT_TYPE_CHOICES = [
        ('disease',  'Disease Detection'),
        ('lameness', 'Lameness Detection'),
    ]

    animal             = models.ForeignKey(Animal, on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='health_alerts')
    detection          = models.ForeignKey(Detection, on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='health_alerts')
    lameness_detection = models.ForeignKey('health.LamenessDetection', on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='health_alerts')
    alert_type         = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES, default='disease')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Health Alert'
        verbose_name_plural = 'Health Alerts'

    def __str__(self):
        return f"HEALTH [{self.severity.upper()}]: {self.title}"


# ─────────────────────────────────────────────────────────────────────────────
# Auto-scan system
# ─────────────────────────────────────────────────────────────────────────────

class AutoScanLog(models.Model):
    """
    Tracks every file processed by the background auto-scan task.
    Used for deduplication (skip files already seen with the same mtime)
    and to provide an audit trail visible in the admin + API.
    """
    FILE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    file_path        = models.CharField(max_length=500)
    file_mtime       = models.FloatField(help_text="os.path.getmtime() at scan time")
    file_size        = models.BigIntegerField(help_text="File size in bytes")
    file_type        = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    scanned_at       = models.DateTimeField(auto_now_add=True)

    detection_found  = models.BooleanField(default=False)
    predicted_result = models.CharField(max_length=100, blank=True)
    confidence       = models.FloatField(null=True, blank=True)

    output_path      = models.CharField(max_length=500, blank=True,
                                        help_text="Path where detected file was copied")

    # Links to created records (optional — may be null if detection not found)
    detection          = models.ForeignKey(Detection, on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='scan_logs')
    lameness_detection = models.ForeignKey('health.LamenessDetection', on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='scan_logs')

    class Meta:
        ordering = ['-scanned_at']
        verbose_name = 'Auto Scan Log'
        verbose_name_plural = 'Auto Scan Logs'
        # Composite unique key: same file + same mtime = already processed
        unique_together = [('file_path', 'file_mtime')]

    def __str__(self):
        status = f"{self.predicted_result} ({self.confidence:.0%})" if self.detection_found else "clean"
        return f"{self.file_type.upper()} | {self.file_path} → {status}"