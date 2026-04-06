from django.db import models
from django.contrib.auth.models import User
from animals.models import Animal
from farms.models import Farm


class Transaction(models.Model):
    """
    Model for tracking financial transactions (expenses and revenue)
    """
    TYPE_CHOICES = [
        ('expense', 'Expense'),
        ('revenue', 'Revenue'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    farm = models.ForeignKey(
        Farm,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='transactions',
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()
    animal = models.ForeignKey(
        Animal,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='transactions'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
    
    def __str__(self):
        return f"{self.type.title()} - {self.category} - ${self.amount}"