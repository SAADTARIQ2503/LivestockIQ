from rest_framework import serializers
from animals.models import MortalityRecord


class MortalityRecordSerializer(serializers.ModelSerializer):
    farm_name = serializers.SerializerMethodField()
    cause_display = serializers.SerializerMethodField()

    class Meta:
        model = MortalityRecord
        fields = [
            'id', 'farm', 'farm_name', 'animal', 'animal_type', 'animal_tag',
            'cause_of_death', 'cause_display', 'date_of_death', 'age_at_death',
            'weight_at_death', 'notes', 'recorded_by', 'created_at',
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at']

    def get_farm_name(self, obj):
        return obj.farm.name if obj.farm else None

    def get_cause_display(self, obj):
        return obj.get_cause_of_death_display()


class MortalityRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MortalityRecord
        fields = [
            'farm', 'animal', 'animal_type', 'animal_tag',
            'cause_of_death', 'date_of_death', 'age_at_death',
            'weight_at_death', 'notes',
        ]

    def create(self, validated_data):
        validated_data['recorded_by'] = self.context['request'].user
        return super().create(validated_data)
