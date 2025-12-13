from django.db import models
from django.contrib.auth.models import User
from django.db.models import Max # For finding the latest ID
import uuid # For generating IDs


class Animal(models.Model):
    # Link the animal to a specific user
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    animal_type = models.CharField(max_length=50)
    age = models.CharField(max_length=50)
    sex = models.CharField(max_length=10)
    
    # NEW FIELDS
    is_healthy = models.BooleanField(default=True)
    # This field will store the name of the vaccine needed if is_healthy is False
    # Max length should be sufficient for a vaccine name.
    required_vaccine = models.CharField(max_length=255, blank=True, null=True)

    # REMOVED: vaccination_detail = models.TextField()

    def __str__(self):
        return self.id

