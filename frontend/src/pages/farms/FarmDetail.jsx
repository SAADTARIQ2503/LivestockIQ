import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmsAPI } from '@/api/farms';
import { animalsAPI } from '@/api/animals';
import { mortalityAPI } from '@/api/mortality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Thermometer, Droplets, Wind,
  Plus, Search, Filter, Beef, Edit, Trash2, Eye,
  Cloud, Warehouse, Skull, X
} from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS, SEX_OPTIONS } from '@/utils/constants';
import { useAnimals } from '@/hooks/useAnimals';
import { useNotificationStore } from '@/store/notificationStore';

export default function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { deleteAnimal, isDeleting } = useAnimals();
  const { addNotification } = useNotificationStore();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ animal_type: '', sex: '', is_healthy: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [deadModal, setDeadModal] = useState(null); // holds the animal being marked dead
  const [deadForm, setDeadForm] = useState({
    cause_of_death: '',
    date_of_death: new Date().toISOString().split('T')[0],
    animal_tag: '',
    weight_at_death: '',
    notes: '',
  });

  const markDeadMutation = useMutation({
    mutationFn: mortalityAPI.create,
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Mortality record saved.' });
      deleteAnimal(deadModal.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['mortality'] });
          setDeadModal(null);
        },
      });
    },
    onError: (err) => {
      addNotification({ type: 'error', message: err.response?.data?.detail || 'Failed to save record.' });
    },
  });

  const handleMarkDead = (e) => {
    e.preventDefault();
    if (!deadModal) return;
    markDeadMutation.mutate({
      farm: parseInt(id),
      animal: deadModal.id,
      animal_type: deadModal.animal_type,
      animal_tag: deadForm.animal_tag || null,
      cause_of_death: deadForm.cause_of_death,
      date_of_death: deadForm.date_of_death,
      age_at_death: `${deadModal.age} months`,
      weight_at_death: deadForm.weight_at_death || null,
      notes: deadForm.notes || null,
    });
  };

  const openDeadModal = (animal) => {
    setDeadForm({
      cause_of_death: '',
      date_of_death: new Date().toISOString().split('T')[0],
      animal_tag: '',
      weight_at_death: '',
      notes: '',
    });
    setDeadModal(animal);
  };

  // Get farm details
  const { data: farmData, isLoading: isLoadingFarm } = useQuery({
    queryKey: ['farm', id],
    queryFn: () => farmsAPI.getById(id),
  });

  // Get animals for this farm
  const { data: animalsData, isLoading: isLoadingAnimals } = useQuery({
    queryKey: ['animals', { farm: id, ...filters }],
    queryFn: () => animalsAPI.getAll({ farm: id, ...filters }),
  });

  // Get farm weather
  const { data: weatherData } = useQuery({
    queryKey: ['farm-weather', id],
    queryFn: async () => {
      const response = await farmsAPI.getFarmsWeather();
      return (response.data ?? []).find(f => f.farm_id === parseInt(id)) ?? null;
    },
    enabled: !!farmData?.data,
    staleTime: 5 * 60 * 1000,
  });

  // Get mortality count for this farm
  const { data: mortalityData } = useQuery({
    queryKey: ['mortality', id],
    queryFn: () => mortalityAPI.getAll({ farm: id }),
  });

  const farm = farmData?.data;
  const animals = Array.isArray(animalsData?.data)
    ? animalsData.data
    : (animalsData?.data?.results || []);
  const weather = weatherData;
  const mortalityRecords = mortalityData?.data?.results ?? mortalityData?.data ?? [];
  const mortalityCount = Array.isArray(mortalityRecords) ? mortalityRecords.length : 0;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ animal_type: '', sex: '', is_healthy: '' });
    setSearch('');
  };

  const handleDelete = (animalId) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      deleteAnimal(animalId);
    }
  };

  // Filter animals by search
  const filteredAnimals = animals.filter(animal => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (animal.user_animal_id ?? animal.id).toString().includes(searchLower) ||
      animal.animal_type.toLowerCase().includes(searchLower) ||
      animal.sex.toLowerCase().includes(searchLower)
    );
  });

  if (isLoadingFarm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Farm not found</h2>
          <p className="text-gray-600 mb-4">The farm you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/farms')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{farm.name}</h1>
            <p className="text-gray-600 flex items-center gap-1 mt-1">
              <MapPin size={16} />
              {farm.address}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/farms/${id}/edit`)}
          >
            <Edit size={16} className="mr-2" />
            Edit Farm
          </Button>
          <Button onClick={() => navigate('/animals/add')}>
            <Plus size={16} className="mr-2" />
            Add Animal
          </Button>
        </div>
      </div>

      {/* Farm Stats & Weather */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Animals Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Beef className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Animals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{animals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Healthy Animals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Beef className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Healthy</p>
                <p className="text-2xl font-bold text-green-600">
                  {animals.filter(a => a.is_healthy).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mortality Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Skull className="text-red-500" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Deaths</p>
                <p className="text-2xl font-bold text-red-500">{mortalityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Card */}
        <Card>
          <CardContent className="p-6">
            {weather && !weather.error ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="text-gray-500 dark:text-gray-400" size={16} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Weather</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    weather.status === 'optimal' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    weather.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{weather.status_label || weather.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Thermometer className="text-orange-500" size={18} />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{weather.temperature}°C</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Humidity</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{weather.humidity}%</p>
                  </div>
                </div>
                {weather.weather_description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{weather.weather_description}</p>
                )}
              </div>
            ) : farm?.latitude ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Cloud size={28} className="mx-auto mb-1" />
                  <p className="text-xs">Weather unavailable</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <MapPin size={28} className="mx-auto mb-1" />
                  <p className="text-xs">No coordinates set</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Animals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Animals in this Farm</h2>
          <span className="text-gray-600">{filteredAnimals.length} animals</span>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search by ID, type, or sex..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={20} />
                Filters
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Animal Type Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Animal Type</label>
                  <select
                    value={filters.animal_type}
                    onChange={(e) => handleFilterChange('animal_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="">All Types</option>
                    {ANIMAL_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sex Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sex</label>
                  <select
                    value={filters.sex}
                    onChange={(e) => handleFilterChange('sex', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="">All</option>
                    {SEX_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Health Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Health Status</label>
                  <select
                    value={filters.is_healthy}
                    onChange={(e) => handleFilterChange('is_healthy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="">All</option>
                    <option value="true">Healthy</option>
                    <option value="false">Need Attention</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="md:col-span-3">
                  <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Animals Grid */}
        {isLoadingAnimals ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAnimals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnimals.map((animal) => (
              <Card key={animal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Beef className="text-primary" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Animal #{animal.user_animal_id ?? animal.id}</h3>
                        <p className="text-sm text-gray-600">{animal.animal_type}</p>
                      </div>
                    </div>
                    <Badge variant={animal.is_healthy ? 'success' : 'destructive'}>
                      {animal.is_healthy ? 'Healthy' : 'Need Attention'}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{animal.age} months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sex:</span>
                      <span className="font-medium">{animal.sex}</span>
                    </div>
                    {animal.required_vaccine && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Required Vaccine:</span>
                        <span className="font-medium text-xs">{animal.required_vaccine}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/animals/${animal.id}`)}
                      className="flex-1"
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/animals/edit/${animal.id}`)}
                      className="flex-1"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      onClick={() => openDeadModal(animal)}
                    >
                      <Skull size={15} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(animal.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Beef className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">No animals found</h3>
              <p className="text-gray-600 mb-4">
                {search || filters.animal_type || filters.sex || filters.is_healthy
                  ? 'Try adjusting your filters or search'
                  : 'Get started by adding your first animal to this farm'}
              </p>
              <Button onClick={() => navigate('/animals/add')}>
                <Plus size={20} className="mr-2" />
                Add Animal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mark as Dead Modal */}
      {deadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Skull size={20} className="text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mark Animal as Dead</h2>
              </div>
              <button onClick={() => setDeadModal(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleMarkDead} className="p-5 space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                This will log a mortality record for <strong>{deadModal.animal_type} #{deadModal.id}</strong> and remove it from your animals list.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cause of Death *</label>
                <select
                  required
                  value={deadForm.cause_of_death}
                  onChange={e => setDeadForm(p => ({ ...p, cause_of_death: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select cause</option>
                  <option value="disease">Disease</option>
                  <option value="accident">Accident</option>
                  <option value="natural">Natural Causes</option>
                  <option value="predator">Predator Attack</option>
                  <option value="unknown">Unknown</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Death *</label>
                <input
                  type="date"
                  required
                  value={deadForm.date_of_death}
                  onChange={e => setDeadForm(p => ({ ...p, date_of_death: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag / Name</label>
                  <input
                    value={deadForm.animal_tag}
                    onChange={e => setDeadForm(p => ({ ...p, animal_tag: e.target.value }))}
                    placeholder="Optional"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={deadForm.weight_at_death}
                    onChange={e => setDeadForm(p => ({ ...p, weight_at_death: e.target.value }))}
                    placeholder="Optional"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={deadForm.notes}
                  onChange={e => setDeadForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional observations..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDeadModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markDeadMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {markDeadMutation.isPending ? 'Saving...' : 'Confirm Death'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}