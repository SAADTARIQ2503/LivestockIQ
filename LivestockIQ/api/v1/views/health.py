"""
Health/Vaccination API Views
"""
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime
from health.models import VaccinationSchedule, VaccineDataset
from api.v1.serializers import (
    VaccinationScheduleSerializer,
    VaccinationScheduleCreateSerializer,
    VaccineDatasetSerializer
)


class VaccinationScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Vaccination Schedule CRUD operations
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return schedules for user's animals or group schedules
        """
        return VaccinationSchedule.objects.filter(
            Q(animal__user=self.request.user) | Q(is_group=True)
        ).order_by('schedule_date')
    
    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action in ['create', 'update', 'partial_update']:
            return VaccinationScheduleCreateSerializer
        return VaccinationScheduleSerializer
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming vaccinations (next 30 days)
        GET /api/v1/health/schedules/upcoming/
        """
        from datetime import timedelta
        today = datetime.now().date()
        next_month = today + timedelta(days=30)
        
        queryset = self.get_queryset().filter(
            schedule_date__range=[today, next_month],
            is_completed=False
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get overdue vaccinations
        GET /api/v1/health/schedules/overdue/
        """
        today = datetime.now().date()
        
        queryset = self.get_queryset().filter(
            schedule_date__lt=today,
            is_completed=False
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a schedule as completed
        POST /api/v1/health/schedules/{id}/complete/
        """
        schedule = self.get_object()
        schedule.is_completed = True
        schedule.save()
        
        serializer = self.get_serializer(schedule)
        return Response({
            'message': 'Vaccination marked as completed',
            'data': serializer.data
        })


class VaccineListView(generics.ListAPIView):
    """
    List all vaccines
    GET /api/v1/health/vaccines/
    """
    queryset = VaccineDataset.objects.all()
    serializer_class = VaccineDatasetSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['species', 'vaccine_name', 'disease']
    search_fields = ['vaccine_name', 'disease']


class VaccineDetailView(generics.RetrieveAPIView):
    """
    Get vaccine details by slug
    GET /api/v1/health/vaccines/{slug}/
    """
    queryset = VaccineDataset.objects.all()
    serializer_class = VaccineDatasetSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


class RecommendedVaccinesView(generics.ListAPIView):
    """
    Get recommended vaccines filtered by season
    GET /api/v1/health/vaccines/recommended/?season=Winter&species=Cow
    """
    serializer_class = VaccineDatasetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        season = self.request.query_params.get('season')
        species = self.request.query_params.get('species')
        
        queryset = VaccineDataset.objects.all()
        
        if species:
            queryset = queryset.filter(species__iexact=species)
        
        if season:
            queryset = queryset.filter(seasonality__icontains=season)
        
        return queryset


class VaccinesBySpeciesView(generics.GenericAPIView):
    """
    Get vaccines by species
    GET /api/v1/health/vaccines/by-species/?species=Cow
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        species = request.query_params.get('species')
        
        if not species:
            return Response({
                'error': 'Species parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        vaccines = VaccineDataset.objects.filter(
            species__iexact=species
        ).values_list('vaccine_name', flat=True).distinct().order_by('vaccine_name')
        
        return Response({
            'species': species,
            'vaccines': list(vaccines)
        })