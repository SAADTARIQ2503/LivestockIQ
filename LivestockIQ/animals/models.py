from django.db import models
from django.contrib.auth.models import User
from django.db.models import Max # For finding the latest ID
import uuid # For generating IDs
# from health.models import VaccineDataset 

class Animal(models.Model):
    # Link the animal to a specific user
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    animal_id = models.CharField(max_length=100, unique=True, editable=False) # Changed to editable=False
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
        return self.animal_id

    # NEW: Function to autogenerate animal IDs (as requested)
    def generate_unique_id(self):
        # Determine the prefix based on animal_type
        prefix_map = {
            'Cow': 'C',
            'Goat': 'G',
            'Sheep': 'S',
        }
        prefix = prefix_map.get(self.animal_type, 'A')
        
        # Find the highest existing ID number for this animal type
        try:
            # Filter IDs by the prefix and order by the numeric part
            last_id = Animal.objects.filter(animal_id__startswith=prefix).aggregate(
                Max('animal_id')
            )['animal_id__max']
            
            if last_id:
                # Extract the numeric part and increment
                num = int(last_id[len(prefix):]) + 1
            else:
                num = 1
        except:
            num = 1 # Fallback
            
        return f"{prefix}{num:04d}" # Format as A0001, C0002, etc.

    def save(self, *args, **kwargs):
        # Auto-generate ID only if it's a new record and ID is not set
        if not self.pk or not self.animal_id:
            self.animal_id = self.generate_unique_id()
            
        super().save(*args, **kwargs)