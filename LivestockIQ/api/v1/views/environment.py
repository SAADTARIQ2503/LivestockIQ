"""
Environment/Weather API Views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import requests
import os
from datetime import datetime


WEATHER_API_KEY =  os.environ.get('OPENWEATHERMAP')
FARM_LAT = os.environ.get('FARM_LATITUDE', '34.0522')
FARM_LON = os.environ.get('FARM_LONGITUDE', '-118.2437')


def get_coordinates(city_name):
    """Converts a city name to latitude and longitude using OpenWeatherMap's Geo API."""
    if not city_name:
        return None, None

    try:
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=1&appid={WEATHER_API_KEY}"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data:
            return data[0]['lat'], data[0]['lon']
    except Exception as e:
        print(f"Geocoding Error: {e}")
    
    return None, None


def get_current_weather(location=None):
    """Fetches real-time environmental data from OpenWeatherMap."""
    if not WEATHER_API_KEY:
        return {'success': False, 'error': 'API Key not configured.'}
    
    lat, lon = float(FARM_LAT), float(FARM_LON)
    
    if location:
        geo_lat, geo_lon = get_coordinates(location)
        if geo_lat and geo_lon:
            lat, lon = geo_lat, geo_lon
        else:
            return {'success': False, 'error': f"Could not find coordinates for '{location}'."}

    try:
        url = (
            f"http://api.openweathermap.org/data/2.5/weather?"
            f"lat={lat}&lon={lon}&units=metric&appid={WEATHER_API_KEY}"
        )
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        rain_volume = data.get('rain', {}).get('1h', 0)
        
        return {
            'success': True,
            'city': data.get('name', location or 'Farm Location'),
            'latitude': lat,
            'longitude': lon,
            'outdoor_temp_c': data['main']['temp'],
            'humidity': data['main']['humidity'],
            'description': data['weather'][0]['description'].capitalize(),
            'rain_chance': 'High' if rain_volume > 0.5 else 'Low',
            'aqi': 100,
            'wind_speed': data['wind']['speed']
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def determine_season(latitude, current_month):
    """Determines the meteorological season based on latitude and month."""
    if latitude >= 0:
        if current_month in [12, 1, 2]:
            return "Winter"
        elif current_month in [3, 4, 5]:
            return "Spring"
        elif current_month in [6, 7, 8]:
            return "Summer"
        else:
            return "Autumn"
    else:
        if current_month in [12, 1, 2]:
            return "Summer"
        elif current_month in [3, 4, 5]:
            return "Autumn"
        elif current_month in [6, 7, 8]:
            return "Winter"
        else:
            return "Spring"


def assess_risk(outdoor_temp, barn_temp, humidity):
    """Assess environmental risks and provide recommendations."""
    recommendations = []
    
    if outdoor_temp > 38 or barn_temp > 35:
        status = "Warning (Heat Stress Risk)"
        status_color = "#dc3545"
        risk_level = "high"
        recommendations.extend([
            "Increase ventilation in barn",
            "Ensure adequate water supply",
            "Provide shade for outdoor animals",
            "Monitor animals for signs of heat stress"
        ])
    elif outdoor_temp < 5:
        status = "Alert (Cold Stress Risk)"
        status_color = "#40c4ff"
        risk_level = "medium"
        recommendations.extend([
            "Ensure proper insulation in barn",
            "Check heating systems",
            "Increase feed rations",
            "Monitor for frostbite"
        ])
    elif humidity > 80:
        status = "Alert (High Humidity/Respiratory Risk)"
        status_color = "#ffc107"
        risk_level = "medium"
        recommendations.extend([
            "Improve barn ventilation",
            "Monitor for respiratory issues",
            "Check bedding moisture levels",
            "Ensure proper drainage"
        ])
    else:
        status = "Optimal"
        status_color = "#28a745"
        risk_level = "low"
        recommendations.append("Environmental conditions are optimal")
    
    return status, status_color, risk_level, recommendations


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_weather_data(request):
    """
    Get current weather data for a location
    GET /api/v1/environment/weather/?location=New York
    """
    location = request.query_params.get('location')
    weather_data = get_current_weather(location)
    
    if weather_data['success']:
        # Add season information
        current_month = datetime.now().month
        city_latitude = weather_data['latitude']
        weather_data['season'] = determine_season(city_latitude, current_month)
    
    return Response(weather_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_environment_status(request):
    """
    Get complete environment status with risk assessment
    GET /api/v1/environment/status/?location=New York
    """
    location = request.query_params.get('location')
    weather_data = get_current_weather(location)
    barn_temp = 25  # Placeholder - could be from sensors
    
    if not weather_data['success']:
        return Response({
            'success': False,
            'error': weather_data.get('error', 'Failed to fetch weather data')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    current_month = datetime.now().month
    city_latitude = weather_data['latitude']
    season = determine_season(city_latitude, current_month)
    outdoor_temp = weather_data['outdoor_temp_c']
    humidity = weather_data['humidity']
    
    # Risk assessment
    current_status, status_color, risk_level, recommendations = assess_risk(
        outdoor_temp, barn_temp, humidity
    )
    
    response_data = {
        'season': season,
        'outdoor_temp_c': round(outdoor_temp, 1),
        'barn_temp_c': barn_temp,
        'humidity': humidity,
        'aqi': weather_data['aqi'],
        'rain_chance': weather_data['rain_chance'],
        'wind_speed': round(weather_data['wind_speed'], 1),
        'description': weather_data['description'],
        'current_status': current_status,
        'status_color': status_color,
        'risk_level': risk_level,
        'location': weather_data['city'],
        'recommendations': recommendations
    }
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_coordinates_for_location(request):
    """
    Get coordinates for a city name
    GET /api/v1/environment/coordinates/?city=London
    """
    city = request.query_params.get('city')
    
    if not city:
        return Response({
            'error': 'City parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    lat, lon = get_coordinates(city)
    
    if lat and lon:
        return Response({
            'city': city,
            'latitude': lat,
            'longitude': lon
        })
    else:
        return Response({
            'error': f'Could not find coordinates for {city}'
        }, status=status.HTTP_404_NOT_FOUND)