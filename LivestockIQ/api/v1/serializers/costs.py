from rest_framework import serializers
from costs.models import Transaction
from farms.models import Farm


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    farm_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id',
            'farm', 'farm_name',
            'type',
            'category',
            'amount',
            'description',
            'date',
            'animal',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'farm_name', 'created_at', 'updated_at']

    def get_farm_name(self, obj):
        return obj.farm.name if obj.farm else None

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_farm(self, farm):
        """Ensure the farm belongs to the requesting user."""
        request = self.context.get('request')
        if farm and request and farm.user != request.user:
            raise serializers.ValidationError("Invalid farm.")
        return farm
