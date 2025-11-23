from django.db import models

class Animal(models.Model):
    animal_id = models.CharField(max_length=100, unique=True)
    animal_type = models.CharField(max_length=50)
    age = models.CharField(max_length=50)
    sex = models.CharField(max_length=10)
    vaccination_detail = models.TextField()

    def __str__(self):
        return self.animal_id
