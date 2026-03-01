import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '@/hooks/useAnimals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Beef, Edit, Trash2, Eye } from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS, SEX_OPTIONS } from '@/utils/constants';

/**
 * Animals List Page
 * Shows all animals with search and filters
 */
export default function AnimalsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    animal_type: '',
    sex: '',
    is_healthy: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { animals, isLoadingAnimals, deleteAnimal, isDeleting } = useAnimals(filters);

  /**
   * Handle search input
   */
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      animal_type: '',
      sex: '',
      is_healthy: '',
    });
    setSearch('');
  };

  /**
   * Handle delete animal
   */
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      deleteAnimal(id);
    }
  };

  /**
   * Filter animals by search
   */
  const animalsList = Array.isArray(animals) ? animals : (animals?.results || []);
  
  const filteredAnimals = animalsList.filter(animal => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      animal.id.toString().includes(searchLower) ||
      animal.animal_type.toLowerCase().includes(searchLower) ||
      animal.sex.toLowerCase().includes(searchLower)
    );
  });

  if (isLoadingAnimals) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading animals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Animals</h1>
          <p className="text-gray-600 mt-1">Manage your livestock</p>
        </div>
        <Button onClick={() => navigate('/animals/add')} className="flex items-center gap-2">
          <Plus size={20} />
          Add Animal
        </Button>
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
                onChange={handleSearch}
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

      {/* Animals Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAnimals?.length || 0} animals
      </div>

      {/* Animals Grid */}
      {filteredAnimals && filteredAnimals.length > 0 ? (
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
                  {animal.vaccine_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vaccine:</span>
                      <span className="font-medium text-xs">{animal.vaccine_name}</span>
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
                : 'Get started by adding your first animal'}
            </p>
            <Button onClick={() => navigate('/animals/add')}>
              <Plus size={20} className="mr-2" />
              Add Animal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}