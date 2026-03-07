"""
Animals API ViewSets
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import date, timedelta
from animals.models import Animal
from health.models import VaccineDataset, VaccinationSchedule
from api.v1.serializers import (
    AnimalSerializer,
    AnimalListSerializer,
    AnimalCreateSerializer,
    VaccineBySpeciesSerializer,
    AnimalStatisticsSerializer,
)


class AnimalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Animal CRUD operations.

    list:           GET  /api/v1/animals/
    create:         POST /api/v1/animals/
    retrieve:       GET  /api/v1/animals/{id}/
    update:         PUT  /api/v1/animals/{id}/
    partial_update: PATCH /api/v1/animals/{id}/
    destroy:        DELETE /api/v1/animals/{id}/
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only animals belonging to the current user."""
        queryset = Animal.objects.filter(user=self.request.user).order_by('-id')

        # Support optional query-param filters on the list endpoint
        farm_id = self.request.query_params.get('farm')
        animal_type = self.request.query_params.get('animal_type')
        sex = self.request.query_params.get('sex')
        is_healthy = self.request.query_params.get('is_healthy')

        if farm_id:
            queryset = queryset.filter(farm_id=farm_id)
        if animal_type:
            queryset = queryset.filter(animal_type__iexact=animal_type)
        if sex:
            queryset = queryset.filter(sex__iexact=sex)
        if is_healthy is not None and is_healthy != '':
            queryset = queryset.filter(is_healthy=is_healthy.lower() == 'true')

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return AnimalListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return AnimalCreateSerializer
        return AnimalSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        animal = serializer.save()

        # AUTO-CREATE VACCINATION SCHEDULE if animal is unhealthy
        if not animal.is_healthy and animal.required_vaccine:
            self._auto_create_vaccination_schedule(animal)

        return Response({
            'message': f'Animal {animal.id} added successfully!',
            'data': AnimalSerializer(animal, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Track if health status is changing from healthy to unhealthy
        was_healthy = instance.is_healthy
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        animal = serializer.save()

        # AUTO-CREATE VACCINATION SCHEDULE if newly marked as unhealthy
        if was_healthy and not animal.is_healthy and animal.required_vaccine:
            self._auto_create_vaccination_schedule(animal)

        return Response({
            'message': f'Animal {animal.id} updated successfully!',
            'data': AnimalSerializer(animal, context={'request': request}).data,
        })

    def _auto_create_vaccination_schedule(self, animal):
        """
        Automatically create a vaccination schedule when animal is marked unhealthy
        """
        # Check if schedule already exists for this vaccine
        existing_schedule = VaccinationSchedule.objects.filter(
            animal=animal,
            vaccine_name=animal.required_vaccine,
            is_completed=False
        ).first()
        
        if existing_schedule:
            return  # Schedule already exists
        
        # Create new schedule for 7 days from now (default)
        schedule_date = date.today() + timedelta(days=7)
        
        VaccinationSchedule.objects.create(
            animal=animal,
            vaccine_name=animal.required_vaccine,
            schedule_date=schedule_date,
            dose_notes=f'Auto-scheduled for unhealthy animal',
            is_group=False,
            is_completed=False
        )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search animals with filters.
        GET /api/v1/animals/search/?animal_type=Cow&sex=Male&age=2
        """
        queryset = self.get_queryset()

        animal_type = request.query_params.get('animal_type')
        sex = request.query_params.get('sex')
        age = request.query_params.get('age')
        is_healthy = request.query_params.get('is_healthy')

        if animal_type:
            queryset = queryset.filter(animal_type__icontains=animal_type)
        if sex:
            queryset = queryset.filter(sex__iexact=sex)
        if age:
            queryset = queryset.filter(age=age)
        if is_healthy is not None:
            queryset = queryset.filter(is_healthy=is_healthy.lower() == 'true')

        serializer = AnimalListSerializer(queryset, many=True)
        return Response({'count': queryset.count(), 'results': serializer.data})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        GET /api/v1/animals/statistics/
        """
        queryset = self.get_queryset()

        total = queryset.count()
        healthy = queryset.filter(is_healthy=True).count()

        by_type = {
            t: queryset.filter(animal_type=t).count()
            for t in ['Cow', 'Goat', 'Sheep']
        }
        by_sex = {
            'Male': queryset.filter(sex='Male').count(),
            'Female': queryset.filter(sex='Female').count(),
        }

        stats = {
            'total_animals': total,
            'healthy_animals': healthy,
            'unhealthy_animals': total - healthy,
            'animals_by_type': by_type,
            'animals_by_sex': by_sex,
            'vaccination_needed': queryset.filter(is_healthy=False).count(),
        }

        serializer = AnimalStatisticsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vaccines_by_species(self, request):
        """
        GET /api/v1/animals/vaccines-by-species/?species=Cow
        """
        species = request.query_params.get('species')

        if not species:
            return Response(
                {'error': 'Species parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vaccines = VaccineDataset.objects.filter(
            animal_species__icontains=species
        ).values_list('vaccine_name', flat=True).distinct().order_by('vaccine_name')

        return Response({'species': species, 'vaccines': list(vaccines)})