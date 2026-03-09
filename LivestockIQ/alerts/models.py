from django.db import models
from django.contrib.auth.models import User
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