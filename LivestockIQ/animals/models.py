from django.db import models, transaction
from django.contrib.auth.models import User


class Animal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    farm = models.ForeignKey(
        'farms.Farm',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='animals'
    )
    # Auto-generated sequential ID per user (1, 2, 3 …) — system use only
    system_id = models.PositiveIntegerField(null=True, blank=True, editable=False)
    # Farmer-assigned tag / brand ID (e.g. "907", "A-42") — matches the physical mark
    tag_id = models.CharField(max_length=50, null=True, blank=True)

    animal_type = models.CharField(max_length=50)
    age = models.CharField(max_length=50)
    sex = models.CharField(max_length=10)
    is_healthy = models.BooleanField(default=True)
    required_vaccine = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = [('user', 'system_id')]

    def save(self, *args, **kwargs):
        if self.user_id and self.system_id is None:
            with transaction.atomic():
                last = (
                    Animal.objects.filter(user_id=self.user_id)
                    .aggregate(max_id=models.Max('system_id'))['max_id']
                ) or 0
                self.system_id = last + 1
        super().save(*args, **kwargs)

    def __str__(self):
        tag = f" [{self.tag_id}]" if self.tag_id else ""
        return f"#{self.system_id}{tag} {self.animal_type} (Farm: {self.farm})"


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
