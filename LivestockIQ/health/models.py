from django.db import models
from django.conf import settings
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
            return f"{self.animal.id} - {self.vaccine_name} on {self.schedule_date}"
        

"""
VaccineDataset model — updated to store all columns from
Livestock_Vaccination_FINAL.xlsx

Columns from Excel:
  Animal Species | Disease Name | Vaccine Name | Age at First Dose
  Booster Dose   | Subsequent Dose | Vaccination Season/Month | Related Information
"""




class VaccineDataset(models.Model):
    """
    Stores the vaccine reference dataset loaded from Excel.
    Used by the LSH recommendation engine.
    """

    animal_species = models.CharField(
    max_length=255,
    default='',
    blank=True,
    help_text="e.g. 'Cattle, Buffalo', 'Calves', 'Sheep & Goats'",
    )
    disease_name = models.CharField(
    max_length=255,
    default='',
    help_text="e.g. 'FMD Foot and Mouth Disease'",
    )   
    vaccine_name = models.CharField(
        max_length=255,
        default='',
        help_text="e.g. 'Inactivated FMD vaccine'",
    )
    age_at_first_dose = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="e.g. '6-8 weeks', '40-60 days prior to calving'",
    )
    booster_dose = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Booster dose schedule if applicable",
    )
    subsequent_dose = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="e.g. 'Annual', 'Every 6 months'",
    )
    vaccination_season = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="e.g. 'FEB-MAR SEP-OCT', 'Spring', 'Annual'",
    )
    related_information = models.TextField(
        null=True,
        blank=True,
        help_text="Dosage, type, manufacturer info from dataset",
    )

    class Meta:
        db_table = "vaccine_dataset"
        ordering = ["animal_species", "disease_name"]
        verbose_name = "Vaccine Dataset Entry"
        verbose_name_plural = "Vaccine Dataset Entries"

    def __str__(self):
        return f"{self.vaccine_name} ({self.animal_species}) — {self.disease_name}"


class LamenessDetection(models.Model):
    """Stores results from the ViT-LSTM lameness video detection model."""

    RESULT_CHOICES = [('normal', 'Normal'), ('lameness', 'Lameness Detected')]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lameness_detections',
    )
    animal = models.ForeignKey(
        Animal,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='lameness_detections',
    )
    video = models.FileField(upload_to='detections/lameness/')
    predicted_result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='normal')
    confidence = models.FloatField(default=0.0)
    all_probabilities = models.JSONField(null=True, blank=True)
    processing_time = models.FloatField(null=True, blank=True)
    frames_sampled = models.IntegerField(default=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Lameness #{self.id} — {self.predicted_result} ({self.confidence:.0%})"