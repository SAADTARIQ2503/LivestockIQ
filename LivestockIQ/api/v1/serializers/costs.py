"""
Cost Calculation Serializers
"""
from rest_framework import serializers


class CostCalculationInputSerializer(serializers.Serializer):
    """
    Input for cost calculation
    """
    animal_type = serializers.ChoiceField(choices=['Cow', 'Goat', 'Sheep'])
    quantity = serializers.IntegerField(min_value=1)
    feed_cost_per_kg = serializers.FloatField(min_value=0)
    feed_consumption_kg_per_day = serializers.FloatField(min_value=0)
    veterinary_cost_per_month = serializers.FloatField(min_value=0, default=0)
    labor_cost_per_month = serializers.FloatField(min_value=0, default=0)
    housing_cost_per_month = serializers.FloatField(min_value=0, default=0)
    other_costs_per_month = serializers.FloatField(min_value=0, default=0)
    calculation_period_months = serializers.IntegerField(min_value=1, default=12)


class CostCalculationOutputSerializer(serializers.Serializer):
    """
    Output for cost calculation
    """
    animal_type = serializers.CharField()
    quantity = serializers.IntegerField()
    
    # Monthly costs
    feed_cost_per_month = serializers.FloatField()
    veterinary_cost_per_month = serializers.FloatField()
    labor_cost_per_month = serializers.FloatField()
    housing_cost_per_month = serializers.FloatField()
    other_costs_per_month = serializers.FloatField()
    total_monthly_cost = serializers.FloatField()
    cost_per_animal_per_month = serializers.FloatField()
    
    # Yearly costs
    total_yearly_cost = serializers.FloatField()
    cost_per_animal_per_year = serializers.FloatField()
    
    # Period costs
    calculation_period_months = serializers.IntegerField()
    total_period_cost = serializers.FloatField()
    
    # Breakdown
    cost_breakdown = serializers.DictField()