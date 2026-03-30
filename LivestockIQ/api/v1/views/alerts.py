from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from alerts.models import Alert, Detection, EnvironmentalAlert, VaccinationAlert, HealthAlert
from api.v1.serializers.alerts import (
    AlertSerializer, DetectionSerializer,
    EnvironmentalAlertSerializer, VaccinationAlertSerializer, HealthAlertSerializer,
)
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
                model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'model_vit.pth')
                
                if not os.path.exists(model_path):
                    return Response(
                        {'error': 'AI model not found. Please contact administrator.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
                
                detector = DiseaseDetector(model_path)

                # Use image if provided, otherwise extract first frame from video
                if detection.image:
                    media_path = detection.image.path
                else:
                    import cv2, tempfile
                    cap = cv2.VideoCapture(detection.video.path)
                    ret, frame = cap.read()
                    cap.release()
                    if not ret:
                        raise ValueError('Could not extract frame from video.')
                    tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
                    cv2.imwrite(tmp.name, frame)
                    media_path = tmp.name

                result = detector.predict(media_path)
                
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
                    message = f"AI detected {result['disease']} with {result['confidence']*100:.1f}% confidence."

                    # Generic system alert (in-app feed)
                    Alert.objects.create(
                        user=request.user,
                        title=title,
                        message=message,
                        severity=severity,
                        animal_id=animal_id if animal_id else None,
                        detection=detection,
                    )

                    # Specialized HealthAlert — sends email + pings system
                    health_alert = HealthAlert.objects.create(
                        user=request.user,
                        title=title,
                        message=message,
                        severity=severity,
                        animal_id=animal_id if animal_id else None,
                        detection=detection,
                        alert_type='disease',
                    )
                    health_alert.send_email_notification()
                    health_alert.ping_system()
                
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


# ─── Specialized alert list & resolve views ───────────────────────────────────

class EnvironmentalAlertListView(generics.ListAPIView):
    """GET /alerts/environmental/ — list environment/weather alerts"""
    serializer_class = EnvironmentalAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EnvironmentalAlert.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            qs = qs.filter(is_resolved=False)
        elif status_filter == 'resolved':
            qs = qs.filter(is_resolved=True)
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)
        return qs


class ResolveEnvironmentalAlertView(APIView):
    """PATCH /alerts/environmental/<pk>/resolve/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            alert = EnvironmentalAlert.objects.get(pk=pk, user=request.user)
            alert.resolve()
            return Response({'message': 'Alert resolved', 'alert': EnvironmentalAlertSerializer(alert).data})
        except EnvironmentalAlert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)


class VaccinationAlertListView(generics.ListAPIView):
    """GET /alerts/vaccination/ — list vaccination schedule alerts"""
    serializer_class = VaccinationAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = VaccinationAlert.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            qs = qs.filter(is_resolved=False)
        elif status_filter == 'resolved':
            qs = qs.filter(is_resolved=True)
        alert_type = self.request.query_params.get('type')
        if alert_type:
            qs = qs.filter(alert_type=alert_type)
        return qs


class ResolveVaccinationAlertView(APIView):
    """PATCH /alerts/vaccination/<pk>/resolve/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            alert = VaccinationAlert.objects.get(pk=pk, user=request.user)
            alert.resolve()
            return Response({'message': 'Alert resolved', 'alert': VaccinationAlertSerializer(alert).data})
        except VaccinationAlert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)


class HealthAlertListView(generics.ListAPIView):
    """GET /alerts/health/ — list disease & lameness detection alerts"""
    serializer_class = HealthAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = HealthAlert.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            qs = qs.filter(is_resolved=False)
        elif status_filter == 'resolved':
            qs = qs.filter(is_resolved=True)
        alert_type = self.request.query_params.get('type')
        if alert_type:
            qs = qs.filter(alert_type=alert_type)
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)
        return qs


class ResolveHealthAlertView(APIView):
    """PATCH /alerts/health/<pk>/resolve/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            alert = HealthAlert.objects.get(pk=pk, user=request.user)
            alert.resolve()
            return Response({'message': 'Alert resolved', 'alert': HealthAlertSerializer(alert).data})
        except HealthAlert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)