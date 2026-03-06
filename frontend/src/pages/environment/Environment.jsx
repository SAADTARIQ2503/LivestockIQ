import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { environmentAPI } from '@/api/environment';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cloud, Thermometer, Droplets, Wind, Eye,
  AlertTriangle, TrendingUp, Calendar, Search,
  MapPin, X, Sunrise, Sunset,
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

  const cityParam = searchedCity || undefined;

  // Status (current weather)
  const { data: statusData, isLoading: isLoadingStatus, error: statusError, refetch: refetchStatus } = useQuery({
    queryKey: ['environment-status', searchedCity],
    queryFn: () => environmentAPI.getCurrentStatus(cityParam),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Statistics
  const { data: statsData } = useQuery({
    queryKey: ['environment-statistics', searchedCity],
    queryFn: () => environmentAPI.getStatistics(cityParam),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Forecast
  const { data: forecastData } = useQuery({
    queryKey: ['environment-forecast', searchedCity],
    queryFn: () => environmentAPI.getForecast(7, cityParam),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Alerts
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['environment-alerts', searchedCity],
    queryFn: () => environmentAPI.getAlerts(cityParam),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const s        = statusData?.data;
  const stats    = statsData?.data;
  const forecast = forecastData?.data || [];
  const alerts   = alertsData?.data  || [];

  const handleSearch = () => {
    const trimmed = cityInput.trim();
    setSearchedCity(trimmed);
  };

  const handleClear = () => {
    setCityInput('');
    setSearchedCity('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ── Loading ──
  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading environmental data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Environment</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-1.5">
            <MapPin size={14} className="text-primary" />
            {s?.city
              ? `${s.city}${s.country ? `, ${s.country}` : ''}`
              : 'Farm Location'}
            {s?.is_farm_location && (
              <span className="text-xs text-gray-400 ml-1">(default)</span>
            )}
          </p>
        </div>

        {/* City search */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search any city..."
              className="pl-9 pr-8"
            />
            {cityInput && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button onClick={handleSearch}>Search</Button>
          {searchedCity && (
            <Button variant="outline" onClick={handleClear}>
              Farm
            </Button>
          )}
        </div>
      </div>

      {/* ── API / search error ── */}
      {statusError && (
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">
              {statusError.response?.data?.error || 'Could not load weather data. Check your API key or city name.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Active alerts ── */}
      {!isLoadingAlerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Card key={i} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle
                  className={alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'}
                  size={18}
                />
                <div>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Season + status strip ── */}
      {s && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600">Season: <strong>{s.season}</strong></span>
          <span className="text-gray-300">|</span>
          <StatusBadge statusKey={s.status} label={s.status_label} />
          <span className="text-xs text-gray-400 ml-auto">
            Updated: {new Date(s.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ── Current conditions grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Temperature */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Temperature</p>
              <Thermometer size={18} className="text-primary opacity-40" />
            </div>
            <p className={`text-4xl font-bold ${getTempColor(s?.temperature || 0)}`}>
              {s?.temperature ?? '--'}°C
            </p>
            {s?.feels_like && (
              <p className="text-xs text-gray-400 mt-1">Feels like {s.feels_like}°C</p>
            )}
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Humidity</p>
              <Droplets size={18} className="text-primary opacity-40" />
            </div>
            <p className="text-4xl font-bold">{s?.humidity ?? '--'}%</p>
            <div className="mt-1">{getHumidityBadge(s?.humidity || 0)}</div>
          </CardContent>
        </Card>

        {/* Wind */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Wind Speed</p>
              <Wind size={18} className="text-primary opacity-40" />
            </div>
            <p className="text-4xl font-bold">{s?.wind_speed ?? '--'}</p>
            <p className="text-xs text-gray-400 mt-1">
              m/s · {getWindDesc(s?.wind_speed || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Visibility</p>
              <Eye size={18} className="text-primary opacity-40" />
            </div>
            <p className="text-4xl font-bold">{s?.visibility ?? '--'}</p>
            <p className="text-xs text-gray-400 mt-1">
              km · {(s?.visibility ?? 0) >= 10 ? 'Clear' : (s?.visibility ?? 0) >= 5 ? 'Moderate' : 'Poor'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Weather detail + statistics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current weather detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud size={18} /> Current Weather
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {s ? (
              <>
                <p className="text-xl font-semibold capitalize">{s.weather_description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-gray-500">Pressure</p>
                    <p className="font-medium">{s.pressure ?? '--'} hPa</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Rain (1h)</p>
                    <p className="font-medium">{s.rain_1h ?? 0} mm</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-gray-500">Sunrise</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-gray-500">Sunset</p>
                  </div>
                  <p className="font-medium">{s.sunrise ?? '--'} UTC</p>
                  <p className="font-medium">{s.sunset ?? '--'} UTC</p>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp size={18} /> Today's Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-3 text-sm">
                {[
                  ['High Temperature', `${stats.temp_max}°C`, 'text-red-600'],
                  ['Low Temperature',  `${stats.temp_min}°C`, 'text-blue-600'],
                  ['Average Humidity', `${stats.humidity_avg}%`, ''],
                  ['Rainfall (1h)',    `${stats.rainfall} mm`, ''],
                  ['Avg Wind Speed',   `${stats.wind_avg} m/s`, ''],
                  ['Pressure',         `${stats.pressure} hPa`, ''],
                ].map(([label, value, color]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No statistics available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 7-Day Forecast ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar size={18} /> 5-Day Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forecast.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {forecast.slice(0, 5).map((day, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <p className="text-xs font-medium text-gray-500">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="my-2">
                    {day.icon
                      ? <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.weather} className="mx-auto w-10 h-10" />
                      : <Cloud size={28} className="mx-auto text-gray-400" />
                    }
                  </div>
                  <p className="text-xs text-gray-600 capitalize">{day.weather}</p>
                  <div className="flex justify-center gap-2 mt-1 text-sm font-semibold">
                    <span className="text-red-500">{day.temp_max}°</span>
                    <span className="text-blue-500">{day.temp_min}°</span>
                  </div>
                  {day.precipitation > 0 && (
                    <p className="text-xs text-blue-400 mt-1">
                      <Droplets size={10} className="inline" /> {day.precipitation}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">Forecast not available</p>
          )}
        </CardContent>
      </Card>

      {/* ── Livestock recommendations ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Livestock Care Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length > 0 ? alerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                alert.severity === 'critical' ? 'bg-red-50' :
                alert.severity === 'warning'  ? 'bg-orange-50' : 'bg-blue-50'
              }`}>
                <AlertTriangle
                  size={16}
                  className={`flex-shrink-0 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'warning'  ? 'text-orange-500' : 'text-blue-500'
                  }`}
                />
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                </div>
              </div>
            )) : (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-green-900">Optimal Conditions</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Current conditions are favorable for livestock. Maintain regular feeding and care routines.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}