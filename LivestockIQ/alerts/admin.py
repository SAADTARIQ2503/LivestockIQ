
from django.contrib import admin
from .models import Alert, Detection, EnvironmentalAlert, VaccinationAlert, HealthAlert, AutoScanLog


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


@admin.register(EnvironmentalAlert)
class EnvironmentalAlertAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'condition_type', 'severity', 'location', 'email_sent', 'is_resolved', 'created_at']
    list_filter   = ['condition_type', 'severity', 'is_resolved', 'email_sent', 'created_at']
    search_fields = ['user__username', 'title', 'location']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']

    fieldsets = (
        ('Alert Info', {'fields': ('user', 'title', 'message', 'severity')}),
        ('Conditions', {'fields': ('condition_type', 'temperature', 'humidity', 'wind_speed', 'location')}),
        ('Status',     {'fields': ('is_resolved', 'resolved_at', 'email_sent')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(VaccinationAlert)
class VaccinationAlertAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'alert_type', 'severity', 'days_until_due', 'email_sent', 'is_resolved', 'created_at']
    list_filter   = ['alert_type', 'severity', 'is_resolved', 'email_sent', 'created_at']
    search_fields = ['user__username', 'title']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']

    fieldsets = (
        ('Alert Info',  {'fields': ('user', 'title', 'message', 'severity')}),
        ('Vaccination', {'fields': ('schedule', 'alert_type', 'days_until_due')}),
        ('Status',      {'fields': ('is_resolved', 'resolved_at', 'email_sent')}),
        ('Timestamps',  {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(HealthAlert)
class HealthAlertAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'alert_type', 'severity', 'animal', 'email_sent', 'is_resolved', 'created_at']
    list_filter   = ['alert_type', 'severity', 'is_resolved', 'email_sent', 'created_at']
    search_fields = ['user__username', 'title']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']

    fieldsets = (
        ('Alert Info', {'fields': ('user', 'title', 'message', 'severity')}),
        ('Related',    {'fields': ('alert_type', 'animal', 'detection', 'lameness_detection')}),
        ('Status',     {'fields': ('is_resolved', 'resolved_at', 'email_sent')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(AutoScanLog)
class AutoScanLogAdmin(admin.ModelAdmin):
    list_display  = ['id', 'file_name_short', 'file_type', 'detection_found',
                     'predicted_result', 'confidence_pct', 'scanned_at']
    list_filter   = ['file_type', 'detection_found', 'scanned_at']
    search_fields = ['file_path', 'predicted_result']
    readonly_fields = ['scanned_at', 'file_mtime', 'file_size']

    fieldsets = (
        ('File Info',    {'fields': ('file_path', 'file_type', 'file_mtime', 'file_size')}),
        ('Result',       {'fields': ('detection_found', 'predicted_result', 'confidence', 'output_path')}),
        ('Links',        {'fields': ('detection', 'lameness_detection')}),
        ('Timestamps',   {'fields': ('scanned_at',), 'classes': ('collapse',)}),
    )

    @admin.display(description='File')
    def file_name_short(self, obj):
        import os
        return os.path.basename(obj.file_path)

    @admin.display(description='Confidence')
    def confidence_pct(self, obj):
        if obj.confidence is None:
            return '—'
        return f"{obj.confidence:.0%}"