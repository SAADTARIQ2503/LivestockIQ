"""
Animals App Serializers for LivestockIQ API
Handles animal CRUD operations and related data
"""

from rest_framework import serializers
from animals.models import Animal
from health.models import VaccineDataset


class AnimalSerializer(serializers.ModelSerializer):
    """
    Serializer for Animal model
    """
    user = serializers.ReadOnlyField(source='user.username')
    required_vaccine_display = serializers.SerializerMethodField()
    health_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Animal
        fields = (
            'id',
            'user',
            'animal_type',
            'age',
            'sex',
            'is_healthy',
            'required_vaccine',
            'required_vaccine_display',
            'health_status'
        )
        read_only_fields = ('id', 'user')
    
    def get_required_vaccine_display(self, obj):
        """
        Return vaccine name if animal is not healthy
        """
        if not obj.is_healthy and obj.required_vaccine:
            return obj.required_vaccine
        return None
    
    def get_health_status(self, obj):
        """
        Return human-readable health status
        """
        if obj.is_healthy:
            return "Healthy"
        elif obj.required_vaccine:
            return f"Requires: {obj.required_vaccine}"
        else:
            return "Unhealthy"
    
    def validate(self, attrs):
        """
        Custom validation
        """
        is_healthy = attrs.get('is_healthy', True)
        required_vaccine = attrs.get('required_vaccine')
        
        # If animal is not healthy, required_vaccine must be provided
        if not is_healthy and not required_vaccine:
            raise serializers.ValidationError({
                'required_vaccine': 'Required vaccine must be specified for unhealthy animals.'
            })
        
        # If animal is healthy, clear required_vaccine
        if is_healthy:
            attrs['required_vaccine'] = None
        
        return attrs
    
    def validate_animal_type(self, value):
        """
        Validate animal type against known species
        """
        valid_types = ['Cow', 'Goat', 'Sheep']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Animal type must be one of: {', '.join(valid_types)}"
            )
        return value
    
    def validate_sex(self, value):
        """
        Validate sex field
        """
        valid_sexes = ['Male', 'Female']
        if value not in valid_sexes:
            raise serializers.ValidationError(
                f"Sex must be either 'Male' or 'Female'"
            )
        return value


class AnimalListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing animals
    """
    health_badge = serializers.SerializerMethodField()
    
    class Meta:
        model = Animal
        fields = (
            'id',
            'animal_type',
            'age',
            'sex',
            'is_healthy',
            'health_badge'
        )
    
    def get_health_badge(self, obj):
        """
        Return badge information for UI
        """
        if obj.is_healthy:
            return {
                'status': 'healthy',
                'text': 'Healthy',
                'color': 'green'
            }
        else:
            return {
                'status': 'unhealthy',
                'text': f'Needs: {obj.required_vaccine}' if obj.required_vaccine else 'Unhealthy',
                'color': 'red'
            }


class AnimalCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating animals with custom validation
    """
    class Meta:
        model = Animal
        fields = (
            'animal_type',
            'age',
            'sex',
            'is_healthy',
            'required_vaccine'
        )
    
    def validate(self, attrs):
        is_healthy = attrs.get('is_healthy', True)
        required_vaccine = attrs.get('required_vaccine')
        animal_type = attrs.get('animal_type')
        
        # Validate required_vaccine for unhealthy animals
        if not is_healthy:
            if not required_vaccine:
                raise serializers.ValidationError({
                    'required_vaccine': 'Required vaccine must be specified for unhealthy animals.'
                })
            
            # Validate that vaccine exists for this species
            vaccine_exists = VaccineDataset.objects.filter(
                species__iexact=animal_type,
                vaccine_name__iexact=required_vaccine
            ).exists()
            
            if not vaccine_exists:
                raise serializers.ValidationError({
                    'required_vaccine': f'Vaccine "{required_vaccine}" is not available for {animal_type}.'
                })
        else:
            attrs['required_vaccine'] = None
        
        return attrs
    
    def create(self, validated_data):
        """
        Create animal and associate with current user
        """
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class VaccineBySpeciesSerializer(serializers.Serializer):
    """
    Serializer for returning vaccines by species
    """
    species = serializers.ChoiceField(
        choices=['Cow', 'Goat', 'Sheep'],
        required=True
    )
    
    def to_representation(self, instance):
        """
        Custom representation to return list of vaccines
        """
        species = self.validated_data.get('species')
        
        vaccines = VaccineDataset.objects.filter(
            species__iexact=species
        ).values_list('vaccine_name', flat=True).distinct().order_by('vaccine_name')
        
        return {
            'species': species,
            'vaccines': list(vaccines)
        }


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
