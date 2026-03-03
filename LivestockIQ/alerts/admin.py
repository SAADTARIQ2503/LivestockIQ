
from django.contrib import admin
from .models import Alert, Detection


@admin.register(Detection)
class DetectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'predicted_disease', 'confidence', 'animal', 'created_at']
    list_filter = ['predicted_disease', 'created_at']
    search_fields = ['user__username', 'animal__id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Detection Info', {
            'fields': ('user', 'animal', 'image', 'video')
        }),
        ('Results', {
            'fields': ('predicted_disease', 'confidence', 'all_probabilities', 
                      'model_used', 'processing_time')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'severity', 'user', 'is_resolved', 'created_at']
    list_filter = ['severity', 'is_resolved', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']
    
    fieldsets = (
        ('Alert Info', {
            'fields': ('user', 'title', 'message', 'severity')
        }),
        ('Related', {
            'fields': ('animal', 'detection')
        }),
        ('Status', {
            'fields': ('is_resolved', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )