"""
Health/Vaccination Serializers
"""
from rest_framework import serializers
from health.models import VaccinationSchedule, VaccineDataset
from animals.models import Animal


class VaccineDatasetSerializer(serializers.ModelSerializer):
    """
    Serializer for VaccineDataset model
    """
    class Meta:
        model = VaccineDataset
        fields = '__all__'


class VaccinationScheduleSerializer(serializers.ModelSerializer):
    """
    Serializer for VaccinationSchedule model
    """
    animal_details = serializers.SerializerMethodField()
    days_until_due = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = VaccinationSchedule
        fields = (
            'id',
            'animal',
            'animal_details',
            'group_type',
            'vaccine_name',
            'schedule_date',
            'dose_notes',
            'is_group',
            'is_completed',
            'days_until_due',
            'status'
        )
        read_only_fields = ('id',)
    
    def get_animal_details(self, obj):
        """
        Return animal details if not a group schedule
        """
        if obj.animal:
            return {
                'id': obj.animal.id,
                'type': obj.animal.animal_type,
                'age': obj.animal.age,
                'sex': obj.animal.sex
            }
        return None
    
    def get_days_until_due(self, obj):
        """
        Calculate days until schedule date
        """
        from datetime import datetime
        today = datetime.now().date()
        delta = obj.schedule_date - today
        return delta.days
    
    def get_status(self, obj):
        """
        Return status badge information
        """
        if obj.is_completed:
            return {
                'text': 'Completed',
                'color': 'green',
                'type': 'completed'
            }
        
        from datetime import datetime
        today = datetime.now().date()
        
        if obj.schedule_date < today:
            return {
                'text': 'Overdue',
                'color': 'red',
                'type': 'overdue'
            }
        elif obj.schedule_date == today:
            return {
                'text': 'Due Today',
                'color': 'orange',
                'type': 'today'
            }
        else:
            return {
                'text': 'Scheduled',
                'color': 'blue',
                'type': 'scheduled'
            }


class VaccinationScheduleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating vaccination schedules
    """
    class Meta:
        model = VaccinationSchedule
        fields = (
            'animal',
            'group_type',
            'vaccine_name',
            'schedule_date',
            'dose_notes',
            'is_group',
            'is_completed'
        )
    
    def validate(self, attrs):
        """
        Validate schedule data
        """
        is_group = attrs.get('is_group', False)
        animal = attrs.get('animal')
        group_type = attrs.get('group_type')
        
        if is_group and not group_type:
            raise serializers.ValidationError({
                'group_type': 'Group type is required for group schedules.'
            })
        
        if not is_group and not animal:
            raise serializers.ValidationError({
                'animal': 'Animal is required for individual schedules.'
            })
        
        # Validate that animal belongs to current user
        if animal and animal.user != self.context['request'].user:
            raise serializers.ValidationError({
                'animal': 'You can only schedule vaccinations for your own animals.'
            })
        
        return attrs
