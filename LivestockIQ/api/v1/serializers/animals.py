"""
Animals Serializers
"""
from datetime import date
from rest_framework import serializers
from animals.models import Animal
from health.models import VaccinationSchedule


class AnimalListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for animal lists
    """
    farm_name = serializers.SerializerMethodField()
    vaccination_status = serializers.SerializerMethodField()
    pending_vaccinations = serializers.SerializerMethodField()
    
    class Meta:
        model = Animal
        fields = [
            'id',
            'user_animal_id',
            'animal_type',
            'age',
            'sex',
            'is_healthy',
            'required_vaccine',
            'farm',
            'farm_name',
            'vaccination_status',
            'pending_vaccinations',
        ]
    
    def get_farm_name(self, obj):
        """Return farm name if farm exists"""
        return obj.farm.name if obj.farm else None
    
    def get_vaccination_status(self, obj):
        """Return vaccination status summary"""
        schedules = VaccinationSchedule.objects.filter(animal=obj)
        total = schedules.count()
        completed = schedules.filter(is_completed=True).count()
        pending = schedules.filter(is_completed=False).count()
        
        return {
            'total': total,
            'completed': completed,
            'pending': pending,
            'has_vaccinations': total > 0
        }
    
    def get_pending_vaccinations(self, obj):
        """Return count of pending vaccinations"""
        return VaccinationSchedule.objects.filter(
            animal=obj,
            is_completed=False
        ).count()


class AnimalSerializer(serializers.ModelSerializer):
    """
    Full serializer for animal details with vaccination history
    """
    farm_name = serializers.SerializerMethodField()
    farm_address = serializers.SerializerMethodField()
    vaccination_history = serializers.SerializerMethodField()
    vaccination_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Animal
        fields = [
            'id',
            'user_animal_id',
            'animal_type',
            'age',
            'sex',
            'is_healthy',
            'required_vaccine',
            'farm',
            'farm_name',
            'farm_address',
            'vaccination_history',
            'vaccination_status',
            'user',
        ]
        read_only_fields = ['id', 'user_animal_id', 'user']
    
    def get_farm_name(self, obj):
        """Return farm name"""
        return obj.farm.name if obj.farm else None
    
    def get_farm_address(self, obj):
        """Return farm address"""
        return obj.farm.address if obj.farm else None
    
    def get_vaccination_history(self, obj):
        """Return complete vaccination history for this animal"""
        schedules = VaccinationSchedule.objects.filter(animal=obj).order_by('-schedule_date')
        
        return [{
            'id': schedule.id,
            'vaccine_name': schedule.vaccine_name,
            'schedule_date': schedule.schedule_date,
            'dose_notes': schedule.dose_notes,
            'is_completed': schedule.is_completed,
            'status': 'Completed' if schedule.is_completed else (
                'Overdue' if schedule.schedule_date < date.today() else 'Scheduled'
            )
        } for schedule in schedules]
    
    def get_vaccination_status(self, obj):
        """Return vaccination status summary"""
        schedules = VaccinationSchedule.objects.filter(animal=obj)
        total = schedules.count()
        completed = schedules.filter(is_completed=True).count()
        pending = schedules.filter(is_completed=False).count()
        overdue = schedules.filter(is_completed=False, schedule_date__lt=date.today()).count()
        
        return {
            'total': total,
            'completed': completed,
            'pending': pending,
            'overdue': overdue,
            'has_vaccinations': total > 0,
            'fully_vaccinated': pending == 0 and total > 0
        }


class AnimalCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating animals
    """
    class Meta:
        model = Animal
        fields = [
            'animal_type',
            'age',
            'sex',
            'is_healthy',
            'required_vaccine',
            'farm',
        ]
    
    def validate(self, attrs):
        """Validate animal data"""
        is_healthy = attrs.get('is_healthy', True)
        required_vaccine = attrs.get('required_vaccine')
        
        # If animal is unhealthy, required_vaccine should be set
        if not is_healthy and not required_vaccine:
            raise serializers.ValidationError({
                'required_vaccine': 'Required vaccine must be specified for unhealthy animals.'
            })
        
        # If animal is healthy, clear required_vaccine
        if is_healthy:
            attrs['required_vaccine'] = None
        
        return attrs
    
    def create(self, validated_data):
        """Create animal with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AnimalStatisticsSerializer(serializers.Serializer):
    """
    Serializer for animal statistics
    """
    total_animals = serializers.IntegerField()
    healthy_animals = serializers.IntegerField()
    unhealthy_animals = serializers.IntegerField()
    animals_by_type = serializers.DictField()
    animals_by_sex = serializers.DictField()
    vaccination_needed = serializers.IntegerField()


class VaccineBySpeciesSerializer(serializers.Serializer):
    """
    Serializer for vaccine by species response
    """
    species = serializers.CharField()
    vaccines = serializers.ListField(child=serializers.CharField())