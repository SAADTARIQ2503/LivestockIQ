import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { farmsAPI } from '@/api/farms';
import { animalsAPI } from '@/api/animals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, MapPin, Thermometer, Droplets, Wind, 
  Plus, Search, Filter, Beef, Edit, Trash2, Eye,
  Cloud, Warehouse
} from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS, SEX_OPTIONS } from '@/utils/constants';
import { useAnimals } from '@/hooks/useAnimals';

export default function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteAnimal, isDeleting } = useAnimals();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    animal_type: '',
    sex: '',
    is_healthy: '',
  });
  const [showFilters, setShowFilters] = useState(false);

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
      const farm = farmData?.data;
      if (!farm?.latitude || !farm?.longitude) return null;
      
      // You might want to create a specific endpoint for single farm weather
      // For now, we'll get all farms weather and filter
      const response = await farmsAPI.getFarmsWeather();
      const farmWeather = response.data?.farms?.find(f => f.farm_id === parseInt(id));
      return farmWeather;
    },
    enabled: !!farmData?.data?.latitude,
    staleTime: 5 * 60 * 1000,
  });

  const farm = farmData?.data;
  const animals = Array.isArray(animalsData?.data) 
    ? animalsData.data 
    : (animalsData?.data?.results || []);
  const weather = weatherData;

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
      animal.id.toString().includes(searchLower) ||
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Animals Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Beef className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Animals</p>
                <p className="text-2xl font-bold">{animals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Healthy Animals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Beef className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Healthy Animals</p>
                <p className="text-2xl font-bold text-green-600">
                  {animals.filter(a => a.is_healthy).length}
                </p>
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
                    <Cloud className="text-gray-600" size={20} />
                    <span className="text-sm text-gray-600">Current Weather</span>
                  </div>
                  <Badge 
                    variant={
                      weather.status === 'optimal' ? 'success' :
                      weather.status === 'warning' ? 'warning' : 'destructive'
                    }
                  >
                    {weather.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="text-orange-500" size={20} />
                    <span className="text-2xl font-bold">{weather.weather?.temperature}°C</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Humidity</p>
                    <p className="text-sm font-medium">{weather.weather?.humidity}%</p>
                  </div>
                </div>
              </div>
            ) : farm.latitude ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Cloud size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Weather unavailable</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <MapPin size={32} className="mx-auto mb-2" />
                  <p className="text-sm">No coordinates set</p>
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
                        <h3 className="font-semibold text-lg">ID: {animal.id}</h3>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/animals/${animal.id}`)}
                      className="flex-1"
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/animals/edit/${animal.id}`)}
                      className="flex-1"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(animal.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
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
    </div>
  );
}