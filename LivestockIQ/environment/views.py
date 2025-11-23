from django.shortcuts import render
from django.conf import settings
import requests
import os
from datetime import datetime
from django.http import JsonResponse

# --- Secure Access ---
# Access the key from settings.py (which pulls from .env)
WEATHER_API_KEY = settings.API_KEYS.get('OPENWEATHERMAP')
# Access coordinates directly from environment variables as a fallback
FARM_LAT = os.environ.get('FARM_LATITUDE', '34.0522')
FARM_LON = os.environ.get('FARM_LONGITUDE', '-118.2437')
# ---------------------

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
    except requests.exceptions.RequestException as e:
        print(f"Geocoding API Error: {e}")
    except (IndexError, KeyError) as e:
        print(f"Geocoding API Response Error: {e}")
    
    return None, None


def get_current_weather(location=None):
    """Fetches real-time environmental data from OpenWeatherMap."""
    if not WEATHER_API_KEY or WEATHER_API_KEY == 'YOUR_OPENWEATHERMAP_KEY_HERE':
        return {'success': False, 'error': 'API Key not configured.'}
    
    lat, lon = FARM_LAT, FARM_LON
    
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
            'outdoor_temp_c': data['main']['temp'],
            'humidity': data['main']['humidity'],
            'description': data['weather'][0]['description'].capitalize(),
            'rain_chance': 'High' if rain_volume > 0.5 else 'Low',
            'aqi': 100, # Placeholder
            'wind_speed': data['wind']['speed']
        }
    except requests.exceptions.RequestException as e:
        print(f"Weather API Error: {e}")
        return {'success': False, 'error': 'Could not connect to weather service.'}
    except KeyError as e:
        print(f"Weather API Response Key Error: {e}")
        return {'success': False, 'error': 'Invalid API response format.'}


def view_data(request):
    location = request.GET.get('location')
    weather_data = get_current_weather(location)
    barn_temp = 25 # Placeholder for barn data
    
    # Get current month (1-12) for seasonal determination
    current_month = datetime.now().month 
    
    if weather_data['success']:
        outdoor_temp = weather_data['outdoor_temp_c']
        
        # --- Seasonal Logic for Pakistan (Generalized) ---
        if current_month in [12, 1, 2]:
            season = "Winter (Sardi)"
        elif current_month in [3, 4]:
            season = "Spring (Bahar)"
        elif current_month in [5, 6]:
            season = "Summer (Garmi)"
        elif current_month in [7, 8]:
            season = "Monsoon (Barsat)"
        else: # Sept, Oct, Nov
            season = "Autumn (Khizan)"
        # --- End Seasonal Logic ---
            
        # Risk assessment
        if outdoor_temp > 38 or barn_temp > 35: # Extreme heat alert
            status = "Warning (Heat Stress Risk)"
            status_color = "#dc3545"
        elif outdoor_temp < 5: # Cold stress alert
            status = "Alert (Cold Stress Risk)"
            status_color = "#40c4ff"
        elif weather_data['humidity'] > 80:
            status = "Alert (High Humidity/Respiratory Risk)"
            status_color = "#ffc107"
        else:
            status = "Optimal"
            status_color = "#28a745"

        context = {
            'season': season,
            'outdoor_temp_c': round(outdoor_temp, 1),
            'barn_temp_c': barn_temp,
            'humidity': weather_data['humidity'],
            'aqi': weather_data['aqi'],
            'rain_chance': weather_data['rain_chance'],
            'wind_speed': round(weather_data['wind_speed'], 1),
            'description': weather_data['description'],
            'current_status': status,
            'status_color': status_color,
            'location': weather_data['city'],
        }
        if request.GET.get('ajax') == 'true':
            return JsonResponse({'success': True, 'context': context})
    else:
        # Fallback context in case of API failure
        context = {
            'season': 'N/A', 'outdoor_temp_c': 'N/A', 
            'barn_temp_c': 'N/A', 'humidity': 'N/A', 'aqi': 'N/A', 
            'rain_chance': 'N/A', 'wind_speed': 'N/A', 'description': weather_data['error'],
            'current_status': 'Error',
            'status_color': '#dc3545',
            'location': weather_data.get('city', 'Error')
        }
        if request.GET.get('ajax') == 'true':
            return JsonResponse({'success': False, 'error': weather_data['error']})

    return render(request, 'environment/view_data.html', context)