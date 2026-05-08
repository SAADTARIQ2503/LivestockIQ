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
        tag_id = request.data.get('tag_id', '').strip()

        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine if image or video
        is_video = file.content_type.startswith('video/')

        # Create detection record (animal linked later after resolution)
        detection = Detection.objects.create(
            user=request.user,
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
                from concurrent.futures import ThreadPoolExecutor
                from ai_service.ocr_service import GotOCRService
                from animals.models import Animal

                model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'livestock_disease_v2.pth')

                if not os.path.exists(model_path):
                    return Response(
                        {'error': 'AI model not found. Please contact administrator.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )

                detector = DiseaseDetector(model_path)
                ocr_svc  = GotOCRService.get_instance()

                # Resolve media path; for video extract first frame
                if detection.image:
                    media_path = detection.image.path
                    _ocr_path = media_path
                    def ocr_fn(_p=_ocr_path):
                        from PIL import Image as _Img
                        return ocr_svc.ocr_image(_Img.open(_p).convert('RGB'))
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
                    _vid_path = detection.video.path
                    def ocr_fn(_p=_vid_path):
                        return ocr_svc.ocr_video_frames(_p, 3)

                # Run detection + OCR in parallel
                with ThreadPoolExecutor(max_workers=2) as pool:
                    det_future = pool.submit(detector.predict, media_path)
                    ocr_future = pool.submit(ocr_fn)
                    result   = det_future.result()
                    try:
                        ocr_text = ocr_future.result(timeout=180)
                    except Exception:
                        ocr_text = ''

                # Always parse the OCR ID so it can be shown on the frontend
                # even when no matching animal exists in the database.
                ocr_id = GotOCRService.parse_animal_id(ocr_text) if ocr_text else None

                # Resolve animal: prefer manual tag_id, fall back to OCR
                resolved_animal = None
                if tag_id:
                    resolved_animal = Animal.objects.filter(user=request.user, tag_id=tag_id).first()

                if resolved_animal is None and ocr_id is not None:
                    # Try tag_id (farmer's physical mark) first, then system_id
                    resolved_animal = (
                        Animal.objects.filter(user=request.user, tag_id=str(ocr_id)).first()
                        or Animal.objects.filter(user=request.user, system_id=ocr_id).first()
                    )

                # Persist result
                detection.predicted_disease = result['disease']
                detection.confidence        = result['confidence']
                detection.all_probabilities = result['all_probabilities']
                detection.processing_time   = result['processing_time']
                if resolved_animal:
                    detection.animal = resolved_animal
                detection.save()

                # Create alerts if disease detected
                if result['disease'] != 'healthy' and result['confidence'] > 0.7:
                    if resolved_animal:
                        resolved_animal.is_healthy = False
                        resolved_animal.save(update_fields=['is_healthy'])

                    severity   = 'critical' if result['confidence'] > 0.9 else 'warning'
                    animal_ref = f" (Animal #{resolved_animal.tag_id or resolved_animal.system_id})" if resolved_animal else ""
                    title      = f"{result['disease'].replace('-', ' ').title()} Detected{animal_ref}"
                    message    = (
                        f"AI detected {result['disease']} with {result['confidence']*100:.1f}% confidence."
                        f"{animal_ref} has been marked as not healthy."
                    )

                    Alert.objects.create(
                        user=request.user,
                        title=title,
                        message=message,
                        severity=severity,
                        animal=resolved_animal,
                        detection=detection,
                    )

                    health_alert = HealthAlert.objects.create(
                        user=request.user,
                        title=title,
                        message=message,
                        severity=severity,
                        animal=resolved_animal,
                        detection=detection,
                        alert_type='disease',
                    )
                    health_alert.send_email_notification()
                    health_alert.ping_system()

                return Response({
                    'detection_id': detection.id,
                    'result': result,
                    'ocr_detected_animal_id': ocr_id,
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


# ─── Auto-scan views ──────────────────────────────────────────────────────────

class AutoScanTriggerView(APIView):
    """
    POST /api/v1/ai/auto-scan/trigger/
    Manually kick off the auto_scan_folders task.
    Staff only — regular users should wait for the periodic beat schedule.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Staff access required'}, status=status.HTTP_403_FORBIDDEN)

        use_celery = getattr(settings, 'USE_CELERY', False)
        if use_celery:
            from alerts.tasks import auto_scan_folders
            task = auto_scan_folders.delay()
            return Response({'message': 'Auto-scan task queued', 'task_id': task.id},
                            status=status.HTTP_202_ACCEPTED)
        else:
            # Run synchronously for dev / testing
            from alerts.tasks import auto_scan_folders
            result = auto_scan_folders()
            return Response({'message': 'Auto-scan complete', 'stats': result})


class AutoScanLogsView(generics.ListAPIView):
    """
    GET /api/v1/ai/auto-scan/logs/
    Returns the AutoScanLog history (most recent first).
    Optional query params: ?file_type=image|video  ?detected=true|false
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from alerts.models import AutoScanLog
        qs = AutoScanLog.objects.all()

        file_type = request.query_params.get('file_type')
        if file_type in ('image', 'video'):
            qs = qs.filter(file_type=file_type)

        detected = request.query_params.get('detected')
        if detected == 'true':
            qs = qs.filter(detection_found=True)
        elif detected == 'false':
            qs = qs.filter(detection_found=False)

        qs = qs[:200]   # cap at 200 rows
        data = [
            {
                'id':               log.id,
                'file_path':        log.file_path,
                'file_name':        os.path.basename(log.file_path),
                'file_type':        log.file_type,
                'file_size':        log.file_size,
                'scanned_at':       log.scanned_at,
                'detection_found':  log.detection_found,
                'predicted_result': log.predicted_result,
                'confidence':       log.confidence,
                'output_path':      log.output_path,
            }
            for log in qs
        ]
        return Response({'count': len(data), 'results': data})


class AutoScanConfigView(APIView):
    """
    GET  /api/v1/ai/auto-scan/config/  — return current config
    PATCH /api/v1/ai/auto-scan/config/ — update thresholds at runtime (staff only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'input_images_dir':       getattr(settings, 'AUTO_SCAN_INPUT_IMAGES',       ''),
            'input_videos_dir':       getattr(settings, 'AUTO_SCAN_INPUT_VIDEOS',       ''),
            'output_dir':             getattr(settings, 'AUTO_SCAN_OUTPUT_DIR',         ''),
            'disease_threshold':      getattr(settings, 'AUTO_SCAN_DISEASE_THRESHOLD',  0.60),
            'lameness_threshold':     getattr(settings, 'AUTO_SCAN_LAMENESS_THRESHOLD', 0.60),
            'schedule':               'every 15 minutes',
        })

    def patch(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Staff access required'}, status=status.HTTP_403_FORBIDDEN)

        allowed = ('AUTO_SCAN_DISEASE_THRESHOLD', 'AUTO_SCAN_LAMENESS_THRESHOLD')
        updated = {}
        for key in allowed:
            param = key.lower().replace('auto_scan_', '')
            val   = request.data.get(param)
            if val is not None:
                try:
                    setattr(settings, key, float(val))
                    updated[key] = float(val)
                except (ValueError, TypeError):
                    return Response({'error': f'Invalid value for {param}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'updated': updated})