from django.db import models
from django.contrib.auth.models import User  # Import User model

class Animal(models.Model):
    # Link the animal to a specific user
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    animal_id = models.CharField(max_length=100, unique=True)
    animal_type = models.CharField(max_length=50)
    age = models.CharField(max_length=50)
    sex = models.CharField(max_length=10)
    vaccination_detail = models.TextField()

    def __str__(self):
        return self.animal_id