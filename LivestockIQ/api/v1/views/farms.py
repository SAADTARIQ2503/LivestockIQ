"""
Farms API Views
Place this file at: LivestockIQ/api/v1/views/farms.py
"""
import requests
from datetime import datetime
from django.conf import settings
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from farms.models import Farm
from api.v1.serializers.farms import FarmSerializer, FarmCreateSerializer


class FarmListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Farm.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return FarmCreateSerializer if self.request.method == 'POST' else FarmSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        farm = serializer.save()
        return Response(FarmSerializer(farm).data, status=status.HTTP_201_CREATED)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FarmSerializer

    def get_queryset(self):
        return Farm.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class FarmGeocodeView(APIView):
    """
    POST /api/v1/farms/geocode/
    Body: { "address": "...", "farm_id": 1 }
    Geocodes address via OpenStreetMap Nominatim (free, no billing required).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        address = request.data.get('address', '').strip()
        if not address:
            return Response({'error': 'address is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resp = requests.get(
                'https://nominatim.openstreetmap.org/search',
                params={'q': address, 'format': 'json', 'limit': 1, 'addressdetails': 1},
                headers={'User-Agent': 'LivestockIQ/1.0 (livestock management system)', 'Accept-Language': 'en'},
                timeout=10
            )
            resp.raise_for_status()
            results = resp.json()
        except requests.RequestException as e:
            return Response({'error': f'Geocoding service unavailable: {e}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if not results:
            return Response(
                {'error': 'Could not find that address. Try adding the city or country name.'},
                status=status.HTTP_404_NOT_FOUND
            )

        lat = float(results[0]['lat'])
        lon = float(results[0]['lon'])

        addr = results[0].get('address', {})
        raw_city = (
            addr.get('city') or addr.get('town') or addr.get('village') or
            addr.get('municipality') or addr.get('county') or addr.get('district') or
            addr.get('state_district') or addr.get('state') or ''
        )
        # Strip common administrative suffixes so "Faisalabad District" → "Faisalabad"
        for suffix in (' District', ' Division', ' City Tehsil', ' Tehsil', ' City'):
            if raw_city.endswith(suffix):
                raw_city = raw_city[:-len(suffix)]
                break
        country = addr.get('country', '')
        formatted_address = ', '.join(filter(None, [raw_city, country])) or results[0].get('display_name', address)

        farm_id = request.data.get('farm_id')
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id, user=request.user)
                farm.latitude = lat
                farm.longitude = lon
                farm.address = formatted_address
                farm.save()
            except Farm.DoesNotExist:
                return Response({'error': 'Farm not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'latitude': lat, 'longitude': lon, 'formatted_address': formatted_address})


class FarmsWeatherView(APIView):
    """
    GET /api/v1/environment/farms-weather/
    Returns current weather for all farms of the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from api.v1.views.environment import assess_status

        WEATHER_API_KEY = settings.API_KEYS.get('OPENWEATHERMAP')
        if not WEATHER_API_KEY:
            return Response({'error': 'Weather API key not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        farms = Farm.objects.filter(user=request.user)
        results = []

        for farm in farms:
            if farm.latitude is None or farm.longitude is None:
                results.append({
                    'farm_id': farm.id,
                    'farm_name': farm.name,
                    'address': farm.address,
                    'error': 'No coordinates — geocode this farm first.',
                })
                continue

            try:
                resp = requests.get(
                    f"http://api.openweathermap.org/data/2.5/weather"
                    f"?lat={farm.latitude}&lon={farm.longitude}&units=metric&appid={WEATHER_API_KEY}",
                    timeout=5
                )
                resp.raise_for_status()
                data = resp.json()

                temp = data['main']['temp']
                humidity = data['main']['humidity']
                wind_speed = data['wind']['speed']
                s_key, s_label = assess_status(temp, humidity, wind_speed)

                results.append({
                    'farm_id': farm.id,
                    'farm_name': farm.name,
                    'address': farm.address,
                    'latitude': farm.latitude,
                    'longitude': farm.longitude,
                    'temperature': round(temp, 1),
                    'feels_like': round(data['main'].get('feels_like', temp), 1),
                    'humidity': humidity,
                    'wind_speed': round(wind_speed, 1),
                    'weather_description': data['weather'][0]['description'].capitalize(),
                    'weather_icon': data['weather'][0].get('icon'),
                    'status': s_key,
                    'status_label': s_label,
                    'timestamp': datetime.utcnow().isoformat(),
                })
            except Exception as e:
                results.append({'farm_id': farm.id, 'farm_name': farm.name, 'error': str(e)})

        return Response(results)
