from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'category', 'amount', 'date', 'animal']
    list_filter = ['type', 'category', 'date']
    search_fields = ['category', 'description', 'notes']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('user', 'type', 'category', 'amount', 'date')
        }),
        ('Additional Information', {
            'fields': ('description', 'animal', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )