"""
Animals App Serializers for LivestockIQ API
Handles animal CRUD operations and related data
"""

from rest_framework import serializers
from animals.models import Animal
from health.models import VaccineDataset


class AnimalSerializer(serializers.ModelSerializer):
    """
    Serializer for Animal model — used for retrieve/update responses.
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
            'health_status',
        )
        read_only_fields = ('id', 'user')

    def get_required_vaccine_display(self, obj):
        if not obj.is_healthy and obj.required_vaccine:
            return obj.required_vaccine
        return None

    def get_health_status(self, obj):
        if obj.is_healthy:
            return "Healthy"
        elif obj.required_vaccine:
            return f"Requires: {obj.required_vaccine}"
        return "Unhealthy"

    def validate_animal_type(self, value):
        valid_types = ['Cow', 'Goat', 'Sheep']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Animal type must be one of: {', '.join(valid_types)}"
            )
        return value

    def validate_sex(self, value):
        valid_sexes = ['Male', 'Female']
        if value not in valid_sexes:
            raise serializers.ValidationError("Sex must be either 'Male' or 'Female'")
        return value

    def validate_age(self, value):
        try:
            age = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Age must be a valid number.")
        if age < 1:
            raise serializers.ValidationError("Age must be at least 1 month.")
        if age > 600:
            raise serializers.ValidationError("Age seems unrealistically high. Please enter age in months (max 600).")
        return str(age)

    def validate(self, attrs):
        is_healthy = attrs.get('is_healthy', True)
        required_vaccine = attrs.get('required_vaccine')

        if not is_healthy and not required_vaccine:
            raise serializers.ValidationError({
                'required_vaccine': 'A required vaccine must be specified for unhealthy animals.'
            })

        if is_healthy:
            attrs['required_vaccine'] = None

        return attrs


class AnimalListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing animals.
    Exposes required_vaccine so the frontend can display it on cards.
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
            'required_vaccine',
            'health_badge',
        )

    def get_health_badge(self, obj):
        if obj.is_healthy:
            return {'status': 'healthy', 'text': 'Healthy', 'color': 'green'}
        return {
            'status': 'unhealthy',
            'text': f'Needs: {obj.required_vaccine}' if obj.required_vaccine else 'Unhealthy',
            'color': 'red',
        }


class AnimalCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating animals with full validation.
    """
    class Meta:
        model = Animal
        fields = (
            'animal_type',
            'age',
            'sex',
            'is_healthy',
            'required_vaccine',
        )

    def validate_animal_type(self, value):
        valid_types = ['Cow', 'Goat', 'Sheep']
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Animal type must be one of: {', '.join(valid_types)}"
            )
        return value

    def validate_sex(self, value):
        valid_sexes = ['Male', 'Female']
        if value not in valid_sexes:
            raise serializers.ValidationError("Sex must be either 'Male' or 'Female'")
        return value

    def validate_age(self, value):
        try:
            age = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Age must be a valid number.")
        if age < 1:
            raise serializers.ValidationError("Age must be at least 1 month.")
        if age > 600:
            raise serializers.ValidationError("Age seems unrealistically high. Please enter age in months (max 600).")
        return str(age)

    def validate(self, attrs):
        is_healthy = attrs.get('is_healthy', True)
        required_vaccine = attrs.get('required_vaccine', '').strip() if attrs.get('required_vaccine') else ''
        animal_type = attrs.get('animal_type', '')

        if not is_healthy:
            if not required_vaccine:
                raise serializers.ValidationError({
                    'required_vaccine': 'A required vaccine must be specified for unhealthy animals.'
                })

            # ✅ Use correct field name: animal_species (not species)
            vaccine_exists = VaccineDataset.objects.filter(
                animal_species__icontains=animal_type,
                vaccine_name__iexact=required_vaccine,
            ).exists()

            if not vaccine_exists:
                raise serializers.ValidationError({
                    'required_vaccine': (
                        f'Vaccine "{required_vaccine}" is not recognised for {animal_type}. '
                        f'Please select a vaccine from the dropdown.'
                    )
                })
        else:
            attrs['required_vaccine'] = None

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class VaccineBySpeciesSerializer(serializers.Serializer):
    """
    Serializer for returning vaccines by species.
    """
    species = serializers.ChoiceField(choices=['Cow', 'Goat', 'Sheep'], required=True)

    def to_representation(self, instance):
        species = self.validated_data.get('species')
        # ✅ Use correct field name: animal_species
        vaccines = VaccineDataset.objects.filter(
            animal_species__icontains=species
        ).values_list('vaccine_name', flat=True).distinct().order_by('vaccine_name')
        return {'species': species, 'vaccines': list(vaccines)}


class AnimalStatisticsSerializer(serializers.Serializer):
    """
    Serializer for animal statistics.
    """
    total_animals = serializers.IntegerField()
    healthy_animals = serializers.IntegerField()
    unhealthy_animals = serializers.IntegerField()
    animals_by_type = serializers.DictField()
    animals_by_sex = serializers.DictField()
    vaccination_needed = serializers.IntegerField()