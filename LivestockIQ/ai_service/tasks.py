from celery import shared_task
from django.conf import settings
from alerts.models import Detection, Alert
from ai_service.disease_detector import DiseaseDetector
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
        model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'vit_fold_1.pth')
        
        # Initialize detector
        detector = DiseaseDetector(model_path)
        
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
        
        # Create alert if disease detected
        if result['disease'] != 'healthy' and result['confidence'] > 0.7:
            severity = 'critical' if result['confidence'] > 0.9 else 'warning'
            
            Alert.objects.create(
                user=detection.user,
                title=f"{result['disease'].replace('-', ' ').title()} Detected",
                message=f"AI detected {result['disease']} with {result['confidence']*100:.1f}% confidence. Immediate attention recommended.",
                severity=severity,
                animal=detection.animal,
                detection=detection
            )
        
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