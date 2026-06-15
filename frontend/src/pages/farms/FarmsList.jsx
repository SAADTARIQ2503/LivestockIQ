import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarms } from '@/hooks/useFarms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, MapPin, Beef } from 'lucide-react';

const STATUS_STYLES = {
  optimal: 'bg-green-100 text-green-800',
  warning: 'bg-orange-100 text-orange-800',
  alert:   'bg-red-100 text-red-800',
};

export default function FarmsList() {
  const navigate = useNavigate();
  const { farms, isLoadingFarms, farmsWeather, deleteFarm, isDeleting } = useFarms();
  const [confirmDelete, setConfirmDelete] = useState(null);

  const getWeather = (farmId) => farmsWeather.find(w => w.farm_id === farmId);

  if (isLoadingFarms) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Farms</h1>
          <p className="text-gray-600 mt-1">{farms.length} farm{farms.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => navigate('/farms/add')} className="flex items-center gap-2">
          <Plus size={18} /> Add Farm
        </Button>
      </div>

      {/* Farms grid */}
      {farms.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No farms yet</h3>
            <p className="text-gray-500 mb-4">Add your first farm to start managing your livestock.</p>
            <Button onClick={() => navigate('/farms/add')}>
              <Plus size={16} className="mr-2" /> Add Your First Farm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm) => {
            const weather = getWeather(farm.id);
            return (
              <Card key={farm.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{farm.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => navigate(`/farms/${farm.id}/edit`)}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => setConfirmDelete(farm.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={13} /> {farm.address}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Animal count */}
                  <div className="flex items-center gap-2 text-sm">
                    <Beef size={15} className="text-gray-400" />
                    <span className="text-gray-600">{farm.animal_count ?? 0} animal{farm.animal_count !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Weather snippet */}
                  {weather && !weather.error && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {weather.weather_icon && (
                            <img src={`https://openweathermap.org/img/wn/${weather.weather_icon}.png`} alt="" className="w-8 h-8" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{weather.temperature}°C</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{weather.weather_description}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[weather.status] || STATUS_STYLES.optimal}`}>
                          {weather.status_label}
                        </span>
                      </div>
                    </div>
                  )}
                  {weather?.error && (
                    <p className="text-xs text-orange-500">{weather.error}</p>
                  )}
                  {!farm.latitude && (
                    <p className="text-xs text-gray-400 italic">No coordinates — edit farm to geocode.</p>
                  )}

                  <Button
                    variant="outline" size="sm" className="w-full"
                    onClick={() => navigate(`/farms/${farm.id}`)}
                  >
                    View Animals
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardContent className="p-6 text-center space-y-4">
              <Trash2 className="mx-auto text-red-500" size={32} />
              <p className="font-semibold">Delete this farm?</p>
              <p className="text-sm text-gray-500">All animals linked to this farm will be unlinked but not deleted.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                <Button
                  variant="destructive" className="flex-1"
                  disabled={isDeleting}
                  onClick={() => { deleteFarm(confirmDelete); setConfirmDelete(null); }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
