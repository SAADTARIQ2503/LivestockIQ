"""
Environment/Weather Serializers
"""
from rest_framework import serializers


class WeatherDataSerializer(serializers.Serializer):
    """
    Serializer for weather data response
    """
    success = serializers.BooleanField()
    city = serializers.CharField(required=False)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)
    outdoor_temp_c = serializers.FloatField(required=False)
    humidity = serializers.IntegerField(required=False)
    description = serializers.CharField(required=False)
    rain_chance = serializers.CharField(required=False)
    aqi = serializers.IntegerField(required=False)
    wind_speed = serializers.FloatField(required=False)
    season = serializers.CharField(required=False)
    error = serializers.CharField(required=False)


class EnvironmentStatusSerializer(serializers.Serializer):
    """
    Serializer for environment status and risk assessment
    """
    season = serializers.CharField()
    outdoor_temp_c = serializers.FloatField()
    barn_temp_c = serializers.FloatField()
    humidity = serializers.IntegerField()
    aqi = serializers.IntegerField()
    rain_chance = serializers.CharField()
    wind_speed = serializers.FloatField()
    description = serializers.CharField()
    current_status = serializers.CharField()
    status_color = serializers.CharField()
    location = serializers.CharField()
    risk_level = serializers.CharField()
    recommendations = serializers.ListField(child=serializers.CharField())


class LocationQuerySerializer(serializers.Serializer):
    """
    Serializer for location query parameter
    """
    location = serializers.CharField(required=False, allow_blank=True)