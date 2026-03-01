from rest_framework import serializers
from costs.models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for Transaction model
    """
    class Meta:
        model = Transaction
        fields = [
            'id', 
            'type', 
            'category', 
            'amount', 
            'description', 
            'date', 
            'animal', 
            'notes', 
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_amount(self, value):
        """Ensure amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
