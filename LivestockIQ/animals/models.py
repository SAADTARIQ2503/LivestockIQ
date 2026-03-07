from django.db import models
from django.contrib.auth.models import User


class Animal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    # New: link to farm (nullable so existing animals don't break)
    farm = models.ForeignKey(
        'farms.Farm',
        on_delete=models.SET_NULL,
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
