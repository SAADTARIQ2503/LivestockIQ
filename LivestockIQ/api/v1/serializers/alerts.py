
"""
Alerts/Anomaly Detection Serializers
"""
from rest_framework import serializers
from alerts.models import Alert, Detection, EnvironmentalAlert, VaccinationAlert, HealthAlert


class AnomalySerializer(serializers.Serializer):
    """
    Serializer for animal behavioral anomalies
    """
    id = serializers.CharField()
    animal_id = serializers.CharField()
    type = serializers.CharField()
    severity = serializers.ChoiceField(choices=['Low', 'Medium', 'High'])
    date = serializers.DateField()
    time = serializers.TimeField()
    duration_minutes = serializers.IntegerField()
    location = serializers.CharField()
    reason = serializers.CharField()
    action = serializers.CharField()
    is_acknowledged = serializers.BooleanField(default=False)
    acknowledged_at = serializers.DateTimeField(required=False, allow_null=True)
    acknowledged_by = serializers.CharField(required=False, allow_null=True)
    
    def to_representation(self, instance):
        """Add computed fields"""
        data = super().to_representation(instance)
        
        # Add severity badge info
        severity_colors = {
            'Low': '#28a745',
            'Medium': '#ffc107',
            'High': '#dc3545'
        }
        data['severity_color'] = severity_colors.get(instance['severity'], '#6c757d')
        
        # Add urgency score (for sorting)
        urgency_scores = {'High': 3, 'Medium': 2, 'Low': 1}
        data['urgency_score'] = urgency_scores.get(instance['severity'], 0)
        
        return data


class AnomalyStatisticsSerializer(serializers.Serializer):
    """
    Serializer for anomaly statistics
    """
    total_anomalies = serializers.IntegerField()
    high_severity = serializers.IntegerField()
    medium_severity = serializers.IntegerField()
    low_severity = serializers.IntegerField()
    acknowledged = serializers.IntegerField()
    unacknowledged = serializers.IntegerField()
    by_type = serializers.DictField()
    recent_anomalies = AnomalySerializer(many=True)


class AcknowledgeAnomalySerializer(serializers.Serializer):
    """
    Serializer for acknowledging an anomaly
    """
    anomaly_id = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)





class DetectionSerializer(serializers.ModelSerializer):
    """Serializer for Detection model"""
    
    class Meta:
        model = Detection
        fields = [
            'id', 'animal', 'image', 'video',
            'predicted_disease', 'confidence', 'all_probabilities',
            'model_used', 'processing_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'predicted_disease', 'confidence', 
                          'all_probabilities', 'model_used', 'processing_time',
                          'created_at', 'updated_at']


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for Alert model"""
    
    class Meta:
        model = Alert
        fields = [
            'id', 'title', 'message', 'severity',
            'animal', 'detection', 'lameness_detection', 'is_resolved', 'resolved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at']


class EnvironmentalAlertSerializer(serializers.ModelSerializer):
    """Serializer for EnvironmentalAlert model"""

    class Meta:
        model = EnvironmentalAlert
        fields = [
            'id', 'title', 'message', 'severity',
            'condition_type', 'temperature', 'humidity', 'wind_speed', 'location',
            'is_resolved', 'resolved_at', 'email_sent', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at', 'email_sent']


class VaccinationAlertSerializer(serializers.ModelSerializer):
    """Serializer for VaccinationAlert model"""

    class Meta:
        model = VaccinationAlert
        fields = [
            'id', 'title', 'message', 'severity',
            'schedule', 'alert_type', 'days_until_due',
            'is_resolved', 'resolved_at', 'email_sent', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at', 'email_sent']


class HealthAlertSerializer(serializers.ModelSerializer):
    """Serializer for HealthAlert model"""

    class Meta:
        model = HealthAlert
        fields = [
            'id', 'title', 'message', 'severity',
            'alert_type', 'animal', 'detection', 'lameness_detection',
            'is_resolved', 'resolved_at', 'email_sent', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at', 'email_sent']