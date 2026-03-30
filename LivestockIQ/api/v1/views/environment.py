import os
import requests
from datetime import datetime

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


WEATHER_API_KEY = settings.API_KEYS.get('OPENWEATHERMAP')
FARM_LAT = float(os.environ.get('FARM_LATITUDE', '31.4273'))
FARM_LON = float(os.environ.get('FARM_LONGITUDE', '73.1166'))


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_coordinates(city_name):
    """Convert city name → (lat, lon) using OpenWeatherMap Geo API."""
    try:
        url = (
            f"http://api.openweathermap.org/geo/1.0/direct"
            f"?q={city_name}&limit=1&appid={WEATHER_API_KEY}"
        )
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if data:
            return data[0]['lat'], data[0]['lon'], data[0].get('country', '')
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None, None, None


def fetch_current_weather(lat, lon):
    """Call OWM current weather endpoint and return raw dict."""
    url = (
        f"http://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&units=metric&appid={WEATHER_API_KEY}"
    )
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    return resp.json()


def fetch_forecast(lat, lon):
    """Call OWM 5-day/3-hour forecast endpoint."""
    url = (
        f"http://api.openweathermap.org/data/2.5/forecast"
        f"?lat={lat}&lon={lon}&units=metric&cnt=56&appid={WEATHER_API_KEY}"
    )
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    return resp.json()


def determine_season(latitude, month):
    if latitude >= 0:  # Northern hemisphere
        if month in [12, 1, 2]:  return 'Winter'
        if month in [3, 4, 5]:   return 'Spring'
        if month in [6, 7, 8]:   return 'Summer'
        return 'Autumn'
    else:              # Southern hemisphere
        if month in [12, 1, 2]:  return 'Summer'
        if month in [3, 4, 5]:   return 'Autumn'
        if month in [6, 7, 8]:   return 'Winter'
        return 'Spring'


def assess_status(temp, humidity, wind_speed):
    if temp > 38:          return 'warning',  'Heat Stress Risk'
    if temp < 5:           return 'alert',    'Cold Stress Risk'
    if humidity > 80:      return 'alert',    'High Humidity / Respiratory Risk'
    if wind_speed > 15:    return 'warning',  'Strong Winds'
    return 'optimal', 'Optimal'


def build_alerts(temp, humidity, wind_speed):
    alerts = []
    if temp > 38:
        alerts.append({
            'title': 'Heat Stress Risk',
            'message': 'Ensure adequate water and shade. Consider indoor housing during peak hours.',
            'severity': 'critical',
        })
    if temp < 5:
        alerts.append({
            'title': 'Cold Stress Risk',
            'message': 'Provide extra bedding and shelter. Monitor animals for hypothermia.',
            'severity': 'warning',
        })
    if humidity > 80:
        alerts.append({
            'title': 'High Humidity Alert',
            'message': 'Monitor for respiratory issues. Ensure proper ventilation in shelters.',
            'severity': 'warning',
        })
    if wind_speed > 15:
        alerts.append({
            'title': 'Strong Winds',
            'message': 'Secure loose structures and move animals to sheltered areas.',
            'severity': 'info',
        })
    return alerts


# ─── Views ────────────────────────────────────────────────────────────────────

class EnvironmentStatusView(APIView):
    """
    GET /api/v1/environment/status/?city=<name>

    Returns current weather conditions for the farm (default) or a searched city.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not WEATHER_API_KEY:
            return Response(
                {'error': 'Weather API key not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        city = request.query_params.get('city', '').strip()
        lat, lon, country = FARM_LAT, FARM_LON, ''
        city_name = 'Farm Location'

        if city:
            g_lat, g_lon, g_country = get_coordinates(city)
            if g_lat is None:
                return Response(
                    {'error': f"Could not find city: '{city}'"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            lat, lon, country = g_lat, g_lon, g_country or ''

        try:
            data = fetch_current_weather(lat, lon)
        except requests.RequestException as e:
            return Response(
                {'error': f'Weather service unavailable: {e}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        temp        = data['main']['temp']
        humidity    = data['main']['humidity']
        wind_speed  = data['wind']['speed']
        rain_1h     = data.get('rain', {}).get('1h', 0)
        month       = datetime.now().month
        season      = determine_season(lat, month)
        s_key, s_label = assess_status(temp, humidity, wind_speed)

        # Sunrise / sunset (epoch → HH:MM)
        def epoch_to_time(ts):
            return datetime.utcfromtimestamp(ts).strftime('%H:%M') if ts else '--'

        sys_data = data.get('sys', {})

        return Response({
            'city':                data.get('name', city or 'Farm Location'),
            'country':             country or sys_data.get('country', ''),
            'latitude':            lat,
            'longitude':           lon,
            'is_farm_location':    not bool(city),
            'season':              season,
            'temperature':         round(temp, 1),
            'feels_like':          round(data['main'].get('feels_like', temp), 1),
            'temp_min':            round(data['main'].get('temp_min', temp), 1),
            'temp_max':            round(data['main'].get('temp_max', temp), 1),
            'humidity':            humidity,
            'pressure':            data['main'].get('pressure'),
            'wind_speed':          round(wind_speed, 1),
            'wind_direction':      data['wind'].get('deg'),
            'visibility':          round(data.get('visibility', 0) / 1000, 1),  # m → km
            'weather_description': data['weather'][0]['description'].capitalize(),
            'weather_icon':        data['weather'][0].get('icon'),
            'rain_1h':             rain_1h,
            'rain_chance':         'High' if rain_1h > 0.5 else 'Low',
            'sunrise':             epoch_to_time(sys_data.get('sunrise')),
            'sunset':              epoch_to_time(sys_data.get('sunset')),
            'status':              s_key,
            'status_label':        s_label,
            'timestamp':           datetime.utcnow().isoformat(),
        })


class EnvironmentStatisticsView(APIView):
    """
    GET /api/v1/environment/statistics/?city=<name>
                                       &latitude=<lat>&longitude=<lon>

    Returns today's min/max/avg derived from OWM current weather.
    (Full historical stats would need a stored EnvironmentReading model.)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not WEATHER_API_KEY:
            return Response({'error': 'API key not configured.'}, status=503)

        city = request.query_params.get('city', '').strip()
        req_lat = request.query_params.get('latitude', '').strip()
        req_lon = request.query_params.get('longitude', '').strip()
        lat, lon = FARM_LAT, FARM_LON

        if req_lat and req_lon:
            try:
                lat, lon = float(req_lat), float(req_lon)
            except ValueError:
                pass
        elif city:
            g_lat, g_lon, _ = get_coordinates(city)
            if g_lat:
                lat, lon = g_lat, g_lon

        try:
            data = fetch_current_weather(lat, lon)
        except requests.RequestException:
            return Response({'error': 'Weather service unavailable.'}, status=503)

        main = data['main']
        return Response({
            'temp_max':     round(main.get('temp_max', main['temp']), 1),
            'temp_min':     round(main.get('temp_min', main['temp']), 1),
            'temp_avg':     round(main['temp'], 1),
            'humidity_avg': main['humidity'],
            'pressure':     main.get('pressure'),
            'rainfall':     round(data.get('rain', {}).get('1h', 0), 2),
            'wind_avg':     round(data['wind']['speed'], 1),
        })


class EnvironmentForecastView(APIView):
    """
    GET /api/v1/environment/forecast/?days=7&city=<name>
                                      &latitude=<lat>&longitude=<lon>

    Returns a daily forecast (up to 5 days) from OWM free-tier 3-hour forecast.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not WEATHER_API_KEY:
            return Response({'error': 'API key not configured.'}, status=503)

        city = request.query_params.get('city', '').strip()
        req_lat = request.query_params.get('latitude', '').strip()
        req_lon = request.query_params.get('longitude', '').strip()
        lat, lon = FARM_LAT, FARM_LON

        if req_lat and req_lon:
            try:
                lat, lon = float(req_lat), float(req_lon)
            except ValueError:
                pass
        elif city:
            g_lat, g_lon, _ = get_coordinates(city)
            if g_lat:
                lat, lon = g_lat, g_lon

        try:
            raw = fetch_forecast(lat, lon)
        except requests.RequestException:
            return Response({'error': 'Forecast service unavailable.'}, status=503)

        # Collapse 3-hour slots into daily summaries
        daily = {}
        for item in raw.get('list', []):
            date_str = item['dt_txt'][:10]  # 'YYYY-MM-DD'
            temp     = item['main']['temp']
            precip   = item.get('pop', 0) * 100  # probability of precipitation %
            desc     = item['weather'][0]['description'].capitalize()
            icon     = item['weather'][0].get('icon', '')

            if date_str not in daily:
                daily[date_str] = {
                    'date':       date_str,
                    'temps':      [],
                    'precips':    [],
                    'weather':    desc,
                    'icon':       icon,
                }
            daily[date_str]['temps'].append(temp)
            daily[date_str]['precips'].append(precip)

        forecast = []
        for date_str, d in sorted(daily.items()):
            forecast.append({
                'date':          date_str,
                'temp_max':      round(max(d['temps']), 1),
                'temp_min':      round(min(d['temps']), 1),
                'temp_avg':      round(sum(d['temps']) / len(d['temps']), 1),
                'precipitation': round(max(d['precips']), 0),
                'weather':       d['weather'],
                'icon':          d['icon'],
            })

        return Response(forecast[:7])


class EnvironmentAlertsView(APIView):
    """
    GET /api/v1/environment/alerts/?city=<name>
                                    &latitude=<lat>&longitude=<lon>

    Returns livestock-relevant weather alerts based on current conditions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not WEATHER_API_KEY:
            return Response({'error': 'API key not configured.'}, status=503)

        city = request.query_params.get('city', '').strip()
        req_lat = request.query_params.get('latitude', '').strip()
        req_lon = request.query_params.get('longitude', '').strip()
        lat, lon = FARM_LAT, FARM_LON

        if req_lat and req_lon:
            try:
                lat, lon = float(req_lat), float(req_lon)
            except ValueError:
                pass
        elif city:
            g_lat, g_lon, _ = get_coordinates(city)
            if g_lat:
                lat, lon = g_lat, g_lon

        try:
            data = fetch_current_weather(lat, lon)
        except requests.RequestException:
            return Response({'error': 'Weather service unavailable.'}, status=503)

        temp       = data['main']['temp']
        humidity   = data['main']['humidity']
        wind_speed = data['wind']['speed']
        wind_kmh   = wind_speed * 3.6
        alerts     = build_alerts(temp, humidity, wind_speed)

        # Persist EnvironmentalAlerts for any triggered conditions
        self._persist_environmental_alerts(request.user, alerts, temp, humidity, wind_kmh, lat, lon)

        return Response(alerts)

    def _persist_environmental_alerts(self, user, alert_dicts, temp, humidity, wind_kmh, lat, lon):
        """
        For each triggered weather condition, create an EnvironmentalAlert if no
        unresolved alert of the same condition type exists within the last 6 hours.
        Sends email + pings system for each newly created alert.
        """
        from alerts.models import EnvironmentalAlert
        from django.utils import timezone
        from datetime import timedelta

        CONDITION_MAP = {
            'Heat Stress Risk':    'heat_stress',
            'Cold Stress Risk':    'cold_stress',
            'High Humidity Alert': 'high_humidity',
            'Strong Winds':        'strong_wind',
        }
        location = f"{lat:.4f}, {lon:.4f}"
        cutoff   = timezone.now() - timedelta(hours=6)

        for a in alert_dicts:
            cond_type = CONDITION_MAP.get(a['title'])
            if not cond_type:
                continue
            if EnvironmentalAlert.objects.filter(
                user=user,
                condition_type=cond_type,
                is_resolved=False,
                created_at__gte=cutoff,
            ).exists():
                continue

            env_alert = EnvironmentalAlert.objects.create(
                user=user,
                title=a['title'],
                message=a['message'],
                severity=a['severity'],
                condition_type=cond_type,
                temperature=temp,
                humidity=humidity,
                wind_speed=wind_kmh,
                location=location,
            )
            env_alert.send_email_notification()
            env_alert.ping_system()
    
    
# ─── URL routing aliases ──────────────────────────────────────────────────────

class CoordinatesView(APIView):
    """
    GET /api/v1/environment/coordinates/?city=<name>
    Returns lat/lon for a given city name.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city = request.query_params.get('city', '').strip()
        if not city:
            return Response({'error': 'city parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
        lat, lon, country = get_coordinates(city)
        if lat is None:
            return Response({'error': f"Could not find city: '{city}'"}, status=status.HTTP_404_NOT_FOUND)
        return Response({'city': city, 'latitude': lat, 'longitude': lon, 'country': country})


# Aliases expected by urls.py
get_weather_data             = EnvironmentStatusView.as_view()
get_environment_status       = EnvironmentStatusView.as_view()
get_coordinates_for_location = CoordinatesView.as_view()