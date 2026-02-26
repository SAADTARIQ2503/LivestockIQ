
"""
Alerts/Anomaly Detection Serializers
"""
from rest_framework import serializers


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
```

### api/v1/views/alerts.py

```python
"""
Alerts/Anomaly Detection API Views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from collections import Counter


# Placeholder data - In production, this would come from CV model/database
ANOMALY_DATA = [
    {
        'id': 'A001',
        'animal_id': '10487',
        'type': 'Excessive Lying/Lethargy',
        'severity': 'High',
        'date': '2025-11-18',
        'time': '14:30',
        'duration_minutes': 180,
        'location': 'Pen B, Stall 5',
        'reason': 'The animal remained motionless for 3 hours, far exceeding normal rest duration (Max 90 min).',
        'action': 'Immediate veterinary check required. Isolate animal and monitor temperature.',
        'is_acknowledged': False,
        'acknowledged_at': None,
        'acknowledged_by': None
    },
    {
        'id': 'A002',
        'animal_id': '10385',
        'type': 'Reduced Feed Intake',
        'severity': 'Medium',
        'date': '2025-11-19',
        'time': '07:00',
        'duration_minutes': 60,
        'location': 'Feeding Trough 3',
        'reason': 'CV model detected only 15 minutes of feeding activity during the critical morning window (Normal > 45 min).',
        'action': 'Check feed quality and competition at the trough. Monitor closely for 24 hours.',
        'is_acknowledged': False,
        'acknowledged_at': None,
        'acknowledged_by': None
    },
    {
        'id': 'A003',
        'animal_id': '10489',
        'type': 'Isolation/Separation',
        'severity': 'Low',
        'date': '2025-11-19',
        'time': '11:15',
        'duration_minutes': 45,
        'location': 'Corner of Pen C',
        'reason': 'Animal remained physically separated from the main group for an unusual duration.',
        'action': 'Could be competition or early illness. Review historical location data. No immediate action.',
        'is_acknowledged': True,
        'acknowledged_at': '2025-11-19T12:00:00Z',
        'acknowledged_by': 'John Doe'
    },
]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_anomalies(request):
    """
    Get all anomalies with optional filtering
    GET /api/v1/alerts/?severity=High&acknowledged=false
    """
    anomalies = ANOMALY_DATA.copy()
    
    # Filter by severity
    severity = request.query_params.get('severity')
    if severity:
        anomalies = [a for a in anomalies if a['severity'] == severity]
    
    # Filter by acknowledged status
    acknowledged = request.query_params.get('acknowledged')
    if acknowledged is not None:
        is_ack = acknowledged.lower() == 'true'
        anomalies = [a for a in anomalies if a['is_acknowledged'] == is_ack]
    
    # Filter by animal_id
    animal_id = request.query_params.get('animal_id')
    if animal_id:
        anomalies = [a for a in anomalies if a['animal_id'] == animal_id]
    
    # Sort by severity (High → Medium → Low)
    severity_order = {'High': 0, 'Medium': 1, 'Low': 2}
    anomalies.sort(key=lambda x: severity_order.get(x['severity'], 3))
    
    return Response({
        'count': len(anomalies),
        'results': anomalies
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_anomaly_detail(request, anomaly_id):
    """
    Get detailed information for a specific anomaly
    GET /api/v1/alerts/{anomaly_id}/
    """
    anomaly = next((item for item in ANOMALY_DATA if item['id'] == anomaly_id), None)
    
    if not anomaly:
        return Response({
            'error': f'Anomaly {anomaly_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(anomaly)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def acknowledge_anomaly(request, anomaly_id):
    """
    Acknowledge an anomaly
    POST /api/v1/alerts/{anomaly_id}/acknowledge/
    Body: {"notes": "Checked animal, administering treatment"}
    """
    anomaly = next((item for item in ANOMALY_DATA if item['id'] == anomaly_id), None)
    
    if not anomaly:
        return Response({
            'error': f'Anomaly {anomaly_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Update anomaly
    anomaly['is_acknowledged'] = True
    anomaly['acknowledged_at'] = datetime.now().isoformat()
    anomaly['acknowledged_by'] = request.user.username
    
    notes = request.data.get('notes', '')
    if notes:
        anomaly['notes'] = notes
    
    return Response({
        'message': f'Anomaly {anomaly_id} acknowledged successfully',
        'data': anomaly
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_anomaly_statistics(request):
    """
    Get statistics about anomalies
    GET /api/v1/alerts/statistics/
    """
    total = len(ANOMALY_DATA)
    high = sum(1 for a in ANOMALY_DATA if a['severity'] == 'High')
    medium = sum(1 for a in ANOMALY_DATA if a['severity'] == 'Medium')
    low = sum(1 for a in ANOMALY_DATA if a['severity'] == 'Low')
    acknowledged = sum(1 for a in ANOMALY_DATA if a['is_acknowledged'])
    unacknowledged = total - acknowledged
    
    # Count by type
    types = [a['type'] for a in ANOMALY_DATA]
    by_type = dict(Counter(types))
    
    # Get recent unacknowledged anomalies
    recent = [a for a in ANOMALY_DATA if not a['is_acknowledged']][:5]
    
    return Response({
        'total_anomalies': total,
        'high_severity': high,
        'medium_severity': medium,
        'low_severity': low,
        'acknowledged': acknowledged,
        'unacknowledged': unacknowledged,
        'by_type': by_type,
        'recent_anomalies': recent
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unacknowledged_anomalies(request):
    """
    Get all unacknowledged anomalies (for notifications)
    GET /api/v1/alerts/unacknowledged/
    """
    unacknowledged = [a for a in ANOMALY_DATA if not a['is_acknowledged']]
    
    # Sort by severity
    severity_order = {'High': 0, 'Medium': 1, 'Low': 2}
    unacknowledged.sort(key=lambda x: severity_order.get(x['severity'], 3))
    
    return Response({
        'count': len(unacknowledged),
        'results': unacknowledged
    })