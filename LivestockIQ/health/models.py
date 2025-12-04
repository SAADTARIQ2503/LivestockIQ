from django.db import models
from animals.models import Animal

class VaccinationSchedule(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, null=True, blank=True)
    group_type = models.CharField(max_length=50, null=True, blank=True)
    vaccine_name = models.CharField(max_length=100)
    schedule_date = models.DateField()
    dose_notes = models.CharField(max_length=255, blank=True, null=True)
    is_group = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False) 

    def __str__(self):
        if self.is_group:
            return f"Group: {self.group_type} - {self.vaccine_name} on {self.schedule_date}"
        else:
            return f"{self.animal.animal_id} - {self.vaccine_name} on {self.schedule_date}"
        

class VaccineDataset(models.Model):
    SPECIES_CHOICES = [
        ('Cow', 'Cow'),
        ('Goat', 'Goat'),
        ('Sheep', 'Sheep'),
    ]

    species = models.CharField(max_length=50, choices=SPECIES_CHOICES)
    vaccine_name = models.CharField(max_length=255)
    disease = models.CharField(max_length=255)
    min_age_months = models.FloatField(default=0, help_text="Minimum age in months")
    dosage_frequency = models.CharField(max_length=100)
    seasonality = models.CharField(max_length=100, null=True, blank=True)
    booster_rule = models.CharField(max_length=255, null=True, blank=True)
    mandatory_conditions = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.species} - {self.vaccine_name}"