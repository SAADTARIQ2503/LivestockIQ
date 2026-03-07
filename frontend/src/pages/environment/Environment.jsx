import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { environmentAPI } from '@/api/environment';
import { useFarms } from '@/hooks/useFarms';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cloud, Thermometer, Droplets, Wind, Eye,
  AlertTriangle, TrendingUp, Calendar, Search,
  MapPin, X, Sunrise, Sunset, Warehouse,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function getTempColor(temp) {
  if (temp >= 35) return 'text-red-600';
  if (temp >= 30) return 'text-orange-500';
  if (temp >= 20) return 'text-green-600';
  if (temp >= 10) return 'text-blue-500';
  return 'text-blue-800';
}

function getHumidityBadge(h) {
  if (h >= 80) return <Badge variant="destructive">High</Badge>;
  if (h >= 60) return <Badge variant="success">Optimal</Badge>;
  if (h >= 40) return <Badge variant="secondary">Moderate</Badge>;
  return <Badge variant="warning">Low</Badge>;
}

function getWindDesc(s) {
  if (s < 5)  return 'Calm';
  if (s < 15) return 'Light';
  if (s < 25) return 'Moderate';
  if (s < 40) return 'Strong';
  return 'Very Strong';
}

function StatusBadge({ statusKey, label }) {
  const styles = {
    optimal: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    alert:   'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[statusKey] || styles.optimal}`}>
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Environment() {
  const [cityInput, setCityInput] = useState('');
  const [searchedCity, setSearchedCity] = useState(''); // committed search term
  const [selectedFarmId, setSelectedFarmId] = useState(''); // NEW: selected farm

  const cityParam = searchedCity || undefined;

  // Get user's farms
  const { farms, isLoadingFarms } = useFarms();
  const farmsList = Array.isArray(farms) ? farms : (farms?.results || []);

  // Get selected farm details
  const selectedFarm = farmsList.find(f => f.id === parseInt(selectedFarmId));

  // Farm weather data - only fetch when farm is selected
  const { data: farmWeatherData, isLoading: isLoadingFarmWeather } = useQuery({
    queryKey: ['single-farm-weather', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarm) return null;
      
      // Use the farm's latitude and longitude to get weather
      const response = await environmentAPI.getCurrentStatus(undefined, {
        latitude: selectedFarm.latitude,
        longitude: selectedFarm.longitude,
      });
      
      return response;
    },
    enabled: !!selectedFarmId && !!selectedFarm?.latitude && !!selectedFarm?.longitude,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Status (current weather for searched city)
  const { data: statusData, isLoading: isLoadingStatus, error: statusError, refetch: refetchStatus } = useQuery({
    queryKey: ['environment-status', searchedCity],
    queryFn: () => environmentAPI.getCurrentStatus(cityParam),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!searchedCity,
  });

  // Statistics
  const { data: statsData } = useQuery({
    queryKey: ['environment-statistics', searchedCity],
    queryFn: () => environmentAPI.getStatistics(cityParam),
    staleTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !!searchedCity,
  });

  // Forecast
  const { data: forecastData } = useQuery({
    queryKey: ['environment-forecast', searchedCity],
    queryFn: () => environmentAPI.getForecast(7, cityParam),
    staleTime: 30 * 60 * 1000,
    retry: 1,
    enabled: !!searchedCity,
  });

  // Alerts
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['environment-alerts', searchedCity],
    queryFn: () => environmentAPI.getAlerts(cityParam),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!searchedCity,
  });

  const s        = statusData?.data;
  const stats    = statsData?.data;
  const forecast = forecastData?.data || [];
  const alerts   = alertsData?.data  || [];
  const farmWeather = farmWeatherData?.data;

  const handleSearch = () => {
    const trimmed = cityInput.trim();
    setSearchedCity(trimmed);
  };

  const handleClearSearch = () => {
    setCityInput('');
    setSearchedCity('');
  };

  const handleFarmChange = (e) => {
    setSelectedFarmId(e.target.value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Environment Monitoring</h1>
        <p className="text-gray-600 mt-1">Monitor weather conditions for your farms and search any city</p>
      </div>

      {/* FARM WEATHER SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Warehouse className="text-primary" size={24} />
          <h2 className="text-2xl font-bold">My Farm Weather</h2>
        </div>

        {/* Farm Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Select a farm to view weather</label>
                {isLoadingFarms ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-input rounded-md">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading farms...
                  </div>
                ) : farmsList.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                    <Warehouse className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-600">
                      No farms found. Add a farm to view its weather conditions.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedFarmId}
                    onChange={handleFarmChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- Select a farm --</option>
                    {farmsList.map(farm => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name} - {farm.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedFarm && !selectedFarm.latitude && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This farm doesn't have coordinates. Weather data is unavailable.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Farm Weather Display */}
        {selectedFarmId && selectedFarm?.latitude && (
          <>
            {isLoadingFarmWeather ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading weather for {selectedFarm.name}...</p>
                </div>
              </div>
            ) : farmWeather ? (
              <Card className="overflow-hidden">
                <div className={`h-2 ${
                  farmWeather.status === 'optimal' ? 'bg-green-500' :
                  farmWeather.status === 'warning' ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Warehouse className="text-primary" size={32} />
                        <div>
                          <CardTitle className="text-2xl">{selectedFarm.name}</CardTitle>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin size={14} />
                            {selectedFarm.address}
                          </p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge statusKey={farmWeather.status} label={farmWeather.status.toUpperCase()} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Thermometer className={`mx-auto mb-2 ${getTempColor(farmWeather.temperature)}`} size={32} />
                      <p className="text-xs text-gray-600 mb-1">Temperature</p>
                      <p className={`text-3xl font-bold ${getTempColor(farmWeather.temperature)}`}>
                        {farmWeather.temperature}°C
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Feels like {farmWeather.feels_like}°C</p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Droplets className="mx-auto mb-2 text-blue-500" size={32} />
                      <p className="text-xs text-gray-600 mb-1">Humidity</p>
                      <p className="text-3xl font-bold text-blue-600">{farmWeather.humidity}%</p>
                      <div className="mt-2">{getHumidityBadge(farmWeather.humidity)}</div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Wind className="mx-auto mb-2 text-gray-600" size={32} />
                      <p className="text-xs text-gray-600 mb-1">Wind Speed</p>
                      <p className="text-3xl font-bold text-gray-700">{farmWeather.wind_speed}</p>
                      <p className="text-xs text-gray-500 mt-1">{getWindDesc(farmWeather.wind_speed)} km/h</p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Eye className="mx-auto mb-2 text-gray-600" size={32} />
                      <p className="text-xs text-gray-600 mb-1">Visibility</p>
                      <p className="text-3xl font-bold text-gray-700">{farmWeather.visibility || 10}</p>
                      <p className="text-xs text-gray-500 mt-1">km</p>
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Cloud className="text-gray-500" size={20} />
                      <div>
                        <p className="text-xs text-gray-600">Weather</p>
                        <p className="font-medium capitalize">{farmWeather.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Droplets className="text-gray-500" size={20} />
                      <div>
                        <p className="text-xs text-gray-600">Pressure</p>
                        <p className="font-medium">{farmWeather.pressure} hPa</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sunrise className="text-orange-500" size={20} />
                      <div>
                        <p className="text-xs text-gray-600">Sunrise</p>
                        <p className="font-medium">{formatTime(farmWeather.sunrise)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sunset className="text-purple-500" size={20} />
                      <div>
                        <p className="text-xs text-gray-600">Sunset</p>
                        <p className="font-medium">{formatTime(farmWeather.sunset)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {farmWeather.recommendations && farmWeather.recommendations.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Livestock Care Recommendations:</h4>
                      <ul className="space-y-1">
                        {farmWeather.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>

      {/* SEARCH BY CITY SECTION */}
      <div className="space-y-4 pt-8 border-t">
        <h2 className="text-2xl font-bold">Search Weather by City</h2>

        {/* Search bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter city name (e.g. Faisalabad, London, Tokyo)"
                  className="pl-10 pr-10"
                />
                {cityInput && (
                  <button
                    onClick={() => setCityInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch} disabled={!cityInput.trim()}>
                <Search size={18} className="mr-2" />
                Search
              </Button>
              {searchedCity && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>
            {searchedCity && (
              <p className="text-sm text-gray-600 mt-2">
                Showing results for: <strong>{searchedCity}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Rest of the existing city weather display */}
        {searchedCity && (
          <>
            {/* Status error */}
            {statusError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-600" size={24} />
                    <div>
                      <p className="font-semibold text-red-900">Unable to fetch weather data</p>
                      <p className="text-sm text-red-700 mt-1">
                        {statusError?.response?.data?.error || 'Please check the city name and try again'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => refetchStatus()} variant="outline" className="mt-4">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading state */}
            {isLoadingStatus && !statusError && (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading weather data...</p>
                </div>
              </div>
            )}

            {/* Current weather (if found) */}
            {s && !statusError && (
              <>
                {/* Main status card */}
                <Card className="overflow-hidden">
                  <div className={`h-2 ${
                    s.status === 'optimal' ? 'bg-green-500' :
                    s.status === 'warning' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Cloud className="text-primary" size={32} />
                          <div>
                            <CardTitle className="text-2xl">Current Conditions</CardTitle>
                            <p className="text-sm text-gray-600">
                              {s.location || searchedCity} • Updated {new Date(s.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <StatusBadge statusKey={s.status} label={s.status.toUpperCase()} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Thermometer className={`mx-auto mb-2 ${getTempColor(s.temperature)}`} size={32} />
                        <p className="text-xs text-gray-600 mb-1">Temperature</p>
                        <p className={`text-3xl font-bold ${getTempColor(s.temperature)}`}>{s.temperature}°C</p>
                        <p className="text-xs text-gray-500 mt-1">Feels like {s.feels_like}°C</p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Droplets className="mx-auto mb-2 text-blue-500" size={32} />
                        <p className="text-xs text-gray-600 mb-1">Humidity</p>
                        <p className="text-3xl font-bold text-blue-600">{s.humidity}%</p>
                        <div className="mt-2">{getHumidityBadge(s.humidity)}</div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Wind className="mx-auto mb-2 text-gray-600" size={32} />
                        <p className="text-xs text-gray-600 mb-1">Wind Speed</p>
                        <p className="text-3xl font-bold text-gray-700">{s.wind_speed}</p>
                        <p className="text-xs text-gray-500 mt-1">{getWindDesc(s.wind_speed)} km/h</p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Eye className="mx-auto mb-2 text-gray-600" size={32} />
                        <p className="text-xs text-gray-600 mb-1">Visibility</p>
                        <p className="text-3xl font-bold text-gray-700">{s.visibility || 10}</p>
                        <p className="text-xs text-gray-500 mt-1">km</p>
                      </div>
                    </div>

                    {/* Additional info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Cloud className="text-gray-500" size={20} />
                        <div>
                          <p className="text-xs text-gray-600">Weather</p>
                          <p className="font-medium capitalize">{s.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Droplets className="text-gray-500" size={20} />
                        <div>
                          <p className="text-xs text-gray-600">Pressure</p>
                          <p className="font-medium">{s.pressure} hPa</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Sunrise className="text-orange-500" size={20} />
                        <div>
                          <p className="text-xs text-gray-600">Sunrise</p>
                          <p className="font-medium">{formatTime(s.sunrise)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Sunset className="text-purple-500" size={20} />
                        <div>
                          <p className="text-xs text-gray-600">Sunset</p>
                          <p className="font-medium">{formatTime(s.sunset)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {s.recommendations && s.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Livestock Care Recommendations:</h4>
                        <ul className="space-y-1">
                          {s.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                {stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp size={20} />
                        Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Avg Temperature</p>
                          <p className="text-2xl font-bold">{stats.avg_temperature}°C</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Max Temperature</p>
                          <p className="text-2xl font-bold text-red-600">{stats.max_temperature}°C</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Min Temperature</p>
                          <p className="text-2xl font-bold text-blue-600">{stats.min_temperature}°C</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Avg Humidity</p>
                          <p className="text-2xl font-bold">{stats.avg_humidity}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Forecast */}
                {forecast.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar size={20} />
                        7-Day Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {forecast.map((day, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors">
                            <p className="text-xs font-semibold text-gray-700 mb-2">{formatDate(day.date)}</p>
                            <Cloud className="mx-auto text-gray-600 mb-2" size={24} />
                            <p className="text-lg font-bold text-gray-900 mb-1">{day.max_temp}°C</p>
                            <p className="text-xs text-gray-600">{day.min_temp}°C</p>
                            <p className="text-xs text-gray-500 mt-2 capitalize">{day.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Alerts */}
                {!isLoadingAlerts && alerts.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-900">
                        <AlertTriangle size={20} />
                        Weather Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {alerts.map((alert, idx) => (
                          <div key={idx} className="p-4 bg-white rounded-lg border border-orange-200">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-orange-900">{alert.title}</p>
                              <Badge variant={alert.severity === 'high' ? 'destructive' : 'warning'}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-orange-800">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}