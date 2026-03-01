import { useEnvironment } from '@/hooks/useEnvironment';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/formatters';

/**
 * Environment Dashboard Page
 * Shows current environmental conditions, forecast, and alerts
 */
export default function Environment() {
  const { 
    status, 
    isLoadingStatus, 
    statistics,
    forecast,
    alerts,
    isLoadingAlerts 
  } = useEnvironment();

  /**
   * Get temperature color class
   */
  const getTempColor = (temp) => {
    if (temp >= 35) return 'text-red-600';
    if (temp >= 30) return 'text-orange-600';
    if (temp >= 20) return 'text-green-600';
    if (temp >= 10) return 'text-blue-600';
    return 'text-blue-800';
  };

  /**
   * Get humidity level badge
   */
  const getHumidityBadge = (humidity) => {
    if (humidity >= 80) return <Badge variant="warning">High</Badge>;
    if (humidity >= 60) return <Badge variant="success">Optimal</Badge>;
    if (humidity >= 40) return <Badge variant="info">Moderate</Badge>;
    return <Badge variant="warning">Low</Badge>;
  };

  /**
   * Get wind speed description
   */
  const getWindDescription = (speed) => {
    if (speed < 5) return 'Calm';
    if (speed < 15) return 'Light';
    if (speed < 25) return 'Moderate';
    if (speed < 40) return 'Strong';
    return 'Very Strong';
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading environmental data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Environment</h1>
        <p className="text-gray-600 mt-1">Monitor environmental conditions</p>
      </div>

      {/* Alerts */}
      {!isLoadingAlerts && alerts && alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert, index) => (
            <Card key={index} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    {alert.timestamp && (
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDateTime(alert.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Current Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Temperature */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className={`text-4xl font-bold mt-2 ${getTempColor(status?.temperature || 0)}`}>
                  {status?.temperature || '--'}°C
                </p>
                {status?.feels_like && (
                  <p className="text-sm text-gray-500 mt-1">
                    Feels like {status.feels_like}°C
                  </p>
                )}
              </div>
              <Thermometer size={48} className="text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Humidity</p>
                <p className="text-4xl font-bold mt-2">
                  {status?.humidity || '--'}%
                </p>
                <div className="mt-2">
                  {getHumidityBadge(status?.humidity || 0)}
                </div>
              </div>
              <Droplets size={48} className="text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Wind Speed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wind Speed</p>
                <p className="text-4xl font-bold mt-2">
                  {status?.wind_speed || '--'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {getWindDescription(status?.wind_speed || 0)}
                </p>
              </div>
              <Wind size={48} className="text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Visibility</p>
                <p className="text-4xl font-bold mt-2">
                  {status?.visibility || '--'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {status?.visibility >= 10 ? 'Clear' : status?.visibility >= 5 ? 'Moderate' : 'Poor'}
                </p>
              </div>
              <Eye size={48} className="text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud size={20} />
              Current Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-semibold capitalize">
                    {status.weather_description || 'Clear Sky'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {formatDateTime(status.timestamp || new Date())}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Pressure</p>
                    <p className="font-semibold">{status.pressure || '--'} hPa</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">UV Index</p>
                    <p className="font-semibold">{status.uv_index || '--'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sunrise</p>
                    <p className="font-semibold">{status.sunrise || '--'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sunset</p>
                    <p className="font-semibold">{status.sunset || '--'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No weather data available</p>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Today's Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statistics ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">High Temperature</span>
                  <span className="font-semibold text-red-600">
                    {statistics.temp_max || '--'}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Low Temperature</span>
                  <span className="font-semibold text-blue-600">
                    {statistics.temp_min || '--'}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Humidity</span>
                  <span className="font-semibold">
                    {statistics.humidity_avg || '--'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rainfall</span>
                  <span className="font-semibold">
                    {statistics.rainfall || '0'} mm
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No statistics available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            7-Day Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forecast && forecast.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {forecast.map((day, index) => (
                <div 
                  key={index} 
                  className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-600">
                    {formatDate(day.date)}
                  </p>
                  <div className="my-3">
                    <Cloud size={32} className="mx-auto text-gray-400" />
                  </div>
                  <p className="text-sm capitalize text-gray-700">
                    {day.weather || 'Clear'}
                  </p>
                  <div className="mt-2 flex justify-center gap-2 text-sm">
                    <span className="text-red-600 font-semibold">
                      {day.temp_max}°
                    </span>
                    <span className="text-blue-600">
                      {day.temp_min}°
                    </span>
                  </div>
                  {day.precipitation && (
                    <p className="text-xs text-gray-500 mt-1">
                      <Droplets size={12} className="inline" /> {day.precipitation}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Forecast data not available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Livestock Care Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Livestock Care Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status?.temperature >= 30 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-medium text-orange-900">High Temperature Alert</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Ensure adequate water supply and shade for animals. Consider indoor housing during peak heat hours.
                  </p>
                </div>
              </div>
            )}
            
            {status?.humidity >= 80 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Droplets className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-medium text-blue-900">High Humidity</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Monitor for respiratory issues. Ensure proper ventilation in shelters.
                  </p>
                </div>
              </div>
            )}
            
            {status?.wind_speed >= 25 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <Wind className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-medium text-yellow-900">Strong Winds</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Secure loose structures. Move animals to sheltered areas if possible.
                  </p>
                </div>
              </div>
            )}

            {(!status?.temperature || status?.temperature < 30) && 
             (!status?.humidity || status?.humidity < 80) && 
             (!status?.wind_speed || status?.wind_speed < 25) && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-medium text-green-900">Optimal Conditions</p>
                  <p className="text-sm text-green-700 mt-1">
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
