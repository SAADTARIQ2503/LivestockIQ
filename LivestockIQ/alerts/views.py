from django.shortcuts import render

# Placeholder Data for Anomalies (Simulating CV Model Output)
# This data is now local to the 'alerts' app.
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
    },
]

def anomalies_view(request):
    """View to list all animals currently flagged with behavioral anomalies."""
    context = {
        'anomalies': ANOMALY_DATA,
        'active_count': len(ANOMALY_DATA),
    }
    # Template path is now alerts/anomalies.html
    return render(request, 'anomalies.html', context)

def anomaly_detail_view(request, anomaly_id):
    """View to show detailed information for a specific anomaly."""
    anomaly = next((item for item in ANOMALY_DATA if item['id'] == anomaly_id), None)
    
    if not anomaly:
        # Simple error handling for demonstration
        return render(request, 'anomalies.html', {'error_message': f"Anomaly ID {anomaly_id} not found."})

    context = {
        'anomaly': anomaly
    }
    # Template path is now alerts/anomaly_detail.html
    return render(request, 'anomaly_detail.html', context)