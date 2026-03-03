from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from alerts.models import Alert, Detection
from api.v1.serializers.alerts import AlertSerializer, DetectionSerializer
from ai_service.disease_detector import DiseaseDetector
from ai_service.tasks import detect_disease_task
import os


class AlertListCreateView(generics.ListCreateAPIView):
    """List and create alerts"""
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Alert.objects.filter(user=self.request.user)
        
        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(is_resolved=False)
        elif status_filter == 'resolved':
            queryset = queryset.filter(is_resolved=True)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete alert"""
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user)


class ResolveAlertView(APIView):
    """Resolve an alert"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk, user=request.user)
            alert.is_resolved = True
            alert.resolved_at = timezone.now()
            alert.save()
            
            return Response({
                'message': 'Alert resolved successfully',
                'alert': AlertSerializer(alert).data
            })
        except Alert.DoesNotExist:
            return Response(
                {'error': 'Alert not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ActiveAlertsView(generics.ListAPIView):
    """Get active alerts"""
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user, is_resolved=False)


class DetectDiseaseView(APIView):
    """Upload and detect disease"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        file = request.FILES.get('file')
        animal_id = request.data.get('animal_id')
        
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine if image or video
        is_video = file.content_type.startswith('video/')
        
        # Create detection record
        detection = Detection.objects.create(
            user=request.user,
            animal_id=animal_id if animal_id else None,
            image=file if not is_video else None,
            video=file if is_video else None,
            predicted_disease='healthy',  # Placeholder
            confidence=0.0  # Placeholder
        )
        
        # Check if using Celery or sync
        use_celery = getattr(settings, 'USE_CELERY', False)
        
        if use_celery:
            # Async processing with Celery
            task = detect_disease_task.delay(detection.id)
            
            return Response({
                'detection_id': detection.id,
                'task_id': task.id,
                'message': 'Processing started. Check status with detection_id.'
            }, status=status.HTTP_202_ACCEPTED)
        else:
            # Synchronous processing
            try:
                model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'cow_disease_model_fold_5.pth')
                
                if not os.path.exists(model_path):
                    return Response(
                        {'error': 'AI model not found. Please contact administrator.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
                
                detector = DiseaseDetector(model_path)
                result = detector.predict(detection.image.path)
                
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
                        user=request.user,
                        title=f"{result['disease'].replace('-', ' ').title()} Detected",
                        message=f"AI detected {result['disease']} with {result['confidence']*100:.1f}% confidence.",
                        severity=severity,
                        animal_id=animal_id if animal_id else None,
                        detection=detection
                    )
                
                return Response({
                    'detection_id': detection.id,
                    'result': result
                })
                
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


class DetectionHistoryView(generics.ListAPIView):
    """Get detection history"""
    serializer_class = DetectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Detection.objects.filter(user=self.request.user)


class DetectionDetailView(generics.RetrieveAPIView):
    """Get single detection"""
    serializer_class = DetectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Detection.objects.filter(user=self.request.user)