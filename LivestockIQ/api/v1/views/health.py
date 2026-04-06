"""
Health/Vaccination API ViewSets
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from datetime import datetime, date
from django.conf import settings
import os
from health.models import VaccinationSchedule, VaccineDataset, LamenessDetection
from animals.models import Animal
from api.v1.serializers.health import (
    VaccinationScheduleSerializer,
    VaccinationScheduleCreateSerializer,
    VaccineDatasetSerializer,
    LamenessDetectionSerializer,
)


class VaccinationScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for VaccinationSchedule CRUD operations
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return schedules for current user's animals"""
        user_animals = Animal.objects.filter(user=self.request.user)
        return VaccinationSchedule.objects.filter(
            animal__in=user_animals
        ).order_by('-schedule_date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VaccinationScheduleCreateSerializer
        return VaccinationScheduleSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        schedule = serializer.save()
        
        return Response({
            'message': 'Vaccination scheduled successfully!',
            'data': VaccinationScheduleSerializer(schedule).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark vaccination as completed
        POST /api/v1/health/schedules/{id}/complete/
        
        AUTOMATICALLY updates animal health status:
        - Sets is_healthy = True
        - Clears required_vaccine field
        """
        schedule = self.get_object()
        
        if schedule.is_completed:
            return Response(
                {'error': 'This vaccination is already marked as completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark schedule as completed
        schedule.is_completed = True
        schedule.save()
        
        # AUTOMATIC HEALTH STATUS UPDATE
        # If this schedule is for a specific animal, update its health
        if schedule.animal:
            animal = schedule.animal
            
            # Check if this was the required vaccine
            if animal.required_vaccine == schedule.vaccine_name or not animal.is_healthy:
                animal.is_healthy = True
                animal.required_vaccine = None
                animal.save()
                
                return Response({
                    'message': f'Vaccination completed! Animal #{animal.id} marked as healthy.',
                    'data': VaccinationScheduleSerializer(schedule).data,
                    'animal_updated': {
                        'id': animal.id,
                        'is_healthy': True,
                        'required_vaccine': None
                    }
                })
        
        return Response({
            'message': 'Vaccination marked as completed!',
            'data': VaccinationScheduleSerializer(schedule).data
        })
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming vaccinations (not completed, scheduled for future)
        GET /api/v1/health/schedules/upcoming/
        """
        today = date.today()
        queryset = self.get_queryset().filter(
            is_completed=False,
            schedule_date__gte=today
        ).order_by('schedule_date')
        
        serializer = VaccinationScheduleSerializer(queryset, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get overdue vaccinations (not completed, past due date)
        GET /api/v1/health/schedules/overdue/
        """
        today = date.today()
        queryset = self.get_queryset().filter(
            is_completed=False,
            schedule_date__lt=today
        ).order_by('schedule_date')
        
        serializer = VaccinationScheduleSerializer(queryset, many=True)
        return Response({'results': serializer.data})
    
    @action(detail=False, methods=['get'])
    def by_animal(self, request):
        """
        Get all vaccination schedules for a specific animal
        GET /api/v1/health/schedules/by_animal/?animal_id=123
        """
        animal_id = request.query_params.get('animal_id')
        
        if not animal_id:
            return Response(
                {'error': 'animal_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            animal = Animal.objects.get(id=animal_id, user=request.user)
        except Animal.DoesNotExist:
            return Response(
                {'error': 'Animal not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        schedules = VaccinationSchedule.objects.filter(
            animal=animal
        ).order_by('-schedule_date')
        
        serializer = VaccinationScheduleSerializer(schedules, many=True)
        return Response({
            'animal_id': animal.id,
            'animal_type': animal.animal_type,
            'count': schedules.count(),
            'results': serializer.data
        })


class VaccineDatasetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for VaccineDataset (read-only)
    """
    queryset = VaccineDataset.objects.all()
    serializer_class = VaccineDatasetSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_species(self, request):
        """
        Get vaccines filtered by animal species
        GET /api/v1/health/vaccines/by-species/?species=Cow
        """
        species = request.query_params.get('species')
        
        if not species:
            return Response(
                {'error': 'species parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vaccines = VaccineDataset.objects.filter(
            animal_species__icontains=species
        ).order_by('vaccine_name')
        
        serializer = VaccineDatasetSerializer(vaccines, many=True)
        return Response({
            'species': species,
            'count': vaccines.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Get recommended vaccines using LSH similarity search.
        GET /api/v1/health/vaccines/recommended/?q=foot+and+mouth&species=Cow&season=Spring&top_n=12
        """
        from health.lsh.vaccine_recommender import VaccineRecommender

        q = request.query_params.get('q', '').strip()
        species = request.query_params.get('species', '').strip()
        season = request.query_params.get('season', '').strip()
        top_n = int(request.query_params.get('top_n', 10))

        # Build query string from params if no explicit query provided
        if not q:
            parts = []
            if season:
                parts.append(season)
            if species:
                parts.append(species)
            else:
                parts.append('cattle buffalo sheep goat livestock vaccine')
            q = ' '.join(parts)

        try:
            recommender = VaccineRecommender.get_instance()
            results = recommender.recommend(q, top_n=top_n)
        except Exception as e:
            return Response(
                {'error': f'Recommendation engine error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'count': len(results),
            'results': results,
        })


class LamenessDetectView(APIView):
    """POST /api/v1/health/lameness/detect/ — run ViT-LSTM on uploaded video."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from ai_service.lameness_detector import LamenessDetector
        from alerts.models import Alert, HealthAlert

        video = request.FILES.get('file')
        animal_id = request.data.get('animal_id')

        if not video:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if not video.content_type.startswith('video/'):
            return Response({'error': 'Uploaded file must be a video.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save detection record (video stored via FileField)
        detection = LamenessDetection.objects.create(
            user=request.user,
            animal_id=animal_id if animal_id else None,
            video=video,
            predicted_result='normal',
            confidence=0.0,
        )

        model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'best_livestock_lameness_model.pth')
        if not os.path.exists(model_path):
            detection.delete()
            return Response(
                {'error': 'Lameness model not found. Please contact the administrator.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            detector = LamenessDetector(model_path)
            result = detector.predict(detection.video.path)
        except Exception as e:
            detection.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Persist result
        detection.predicted_result = result['disease']
        detection.confidence = result['confidence']
        detection.all_probabilities = result['all_probabilities']
        detection.processing_time = result['processing_time']
        detection.frames_sampled = result['frames_sampled']
        detection.save()

        # Auto-create alerts whenever lameness is detected
        if result['disease'] == 'lameness' and result['confidence'] > 0.50:
            severity = 'critical' if result['confidence'] > 0.80 else 'warning'
            title   = 'Lameness Detected'
            message = f"ViT-LSTM detected lameness with {result['confidence']*100:.1f}% confidence."

            Alert.objects.create(
                user=request.user,
                title=title,
                message=message,
                severity=severity,
                animal_id=animal_id if animal_id else None,
                lameness_detection=detection,
            )

            health_alert = HealthAlert.objects.create(
                user=request.user,
                title=title,
                message=message,
                severity=severity,
                animal_id=animal_id if animal_id else None,
                lameness_detection=detection,
                alert_type='lameness',
            )
            health_alert.send_email_notification()
            health_alert.ping_system()

        return Response({
            'detection_id': detection.id,
            'result': result,
        })


class LamenessHistoryView(APIView):
    """GET /api/v1/health/lameness/history/ — list past lameness detections."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = LamenessDetection.objects.filter(user=request.user)
        serializer = LamenessDetectionSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)