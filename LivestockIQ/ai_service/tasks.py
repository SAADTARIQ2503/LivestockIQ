from celery import shared_task
from django.conf import settings
from alerts.models import Detection, Alert, HealthAlert
import os


@shared_task
def detect_disease_task(detection_id):
    """
    Celery task for async disease detection
    
    Args:
        detection_id: Detection model ID
        
    Returns:
        dict: Detection results
    """
    try:
        detection = Detection.objects.get(id=detection_id)
        
        # Get model path
        from ai_service.model_registry import get_disease_detector
        detector = get_disease_detector()
        
        # Get image path
        image_path = detection.image.path if detection.image else detection.video.path
        
        # Run prediction
        result = detector.predict(image_path)
        
        # Update detection
        detection.predicted_disease = result['disease']
        detection.confidence = result['confidence']
        detection.all_probabilities = result['all_probabilities']
        detection.processing_time = result['processing_time']
        detection.save()
        
        # Create alerts if disease detected
        if result['disease'] != 'healthy' and result['confidence'] > 0.7:
            severity = 'critical' if result['confidence'] > 0.9 else 'warning'
            title   = f"{result['disease'].replace('-', ' ').title()} Detected"
            message = f"AI detected {result['disease']} with {result['confidence']*100:.1f}% confidence. Immediate attention recommended."

            Alert.objects.create(
                user=detection.user,
                title=title,
                message=message,
                severity=severity,
                animal=detection.animal,
                detection=detection,
            )

            health_alert = HealthAlert.objects.create(
                user=detection.user,
                title=title,
                message=message,
                severity=severity,
                animal=detection.animal,
                detection=detection,
                alert_type='disease',
            )
            health_alert.send_email_notification()
            health_alert.ping_system()
        
        return {
            'success': True,
            'detection_id': detection_id,
            'result': result
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def process_video_detection(detection_id):
    """
    Process video file - extract frames and analyze
    """
    try:
        detection = Detection.objects.get(id=detection_id)
        
        # TODO: Extract frames from video
        # TODO: Run detection on each frame
        # TODO: Aggregate results
        
        return {
            'success': True,
            'message': 'Video processing not yet implemented'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }