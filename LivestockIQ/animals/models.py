from django.db import models
from django.contrib.auth.models import User


class Animal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    # New: link to farm (nullable so existing animals don't break)
    farm = models.ForeignKey(
        'farms.Farm',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='animals'
    )
    animal_type = models.CharField(max_length=50)
    age = models.CharField(max_length=50)
    sex = models.CharField(max_length=10)
    is_healthy = models.BooleanField(default=True)
    required_vaccine = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.animal_type} (Farm: {self.farm})"


class MortalityRecord(models.Model):
    CAUSE_CHOICES = [
        ('disease', 'Disease'),
        ('accident', 'Accident'),
        ('natural', 'Natural Causes'),
        ('predator', 'Predator Attack'),
        ('unknown', 'Unknown'),
        ('other', 'Other'),
    ]

    farm = models.ForeignKey(
        'farms.Farm',
        on_delete=models.CASCADE,
        related_name='mortality_records'
    )
    animal = models.ForeignKey(
        'animals.Animal',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mortality_record'
    )
    animal_type = models.CharField(max_length=50)
    animal_tag = models.CharField(max_length=100, blank=True, null=True)
    cause_of_death = models.CharField(max_length=50, choices=CAUSE_CHOICES)
    date_of_death = models.DateField()
    age_at_death = models.CharField(max_length=50)
    weight_at_death = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mortality_records')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_of_death']

    def __str__(self):
        return f"{self.animal_type} - {self.cause_of_death} ({self.date_of_death})"
