import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAnimals } from '@/hooks/useAnimals';
import { farmsAPI } from '@/api/farms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Filter, Beef, Edit, Trash2, Eye,
  MapPin, ChevronDown, ChevronUp, Home,
} from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS, SEX_OPTIONS } from '@/utils/constants';

export default function AnimalsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ animal_type: '', sex: '', is_healthy: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedFarms, setCollapsedFarms] = useState({});

  const { animals, isLoadingAnimals, deleteAnimal, isDeleting } = useAnimals(filters);

  const { data: farmsData, isLoading: isLoadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmsAPI.getAll(),
  });

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const clearFilters = () => {
    setFilters({ animal_type: '', sex: '', is_healthy: '' });
    setSearch('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      deleteAnimal(id);
    }
  };

  const toggleFarm = (farmKey) => {
    setCollapsedFarms(prev => ({ ...prev, [farmKey]: !prev[farmKey] }));
  };

  const animalsList = Array.isArray(animals) ? animals : (animals?.results || []);

  const filteredAnimals = animalsList.filter(animal => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      animal.id.toString().includes(s) ||
      animal.animal_type.toLowerCase().includes(s) ||
      animal.sex.toLowerCase().includes(s) ||
      (animal.farm_name && animal.farm_name.toLowerCase().includes(s))
    );
  });

  // Build farm lookup from farms API (ListCreateAPIView returns a plain array)
  const farms = Array.isArray(farmsData?.data) ? farmsData.data : (farmsData?.data?.results || []);
  const farmMap = {};
  farms.forEach(f => { farmMap[f.id] = f; });

  // Group animals: keyed by farm id or 'unassigned'
  const groups = {};
  filteredAnimals.forEach(animal => {
    const key = animal.farm ? String(animal.farm) : 'unassigned';
    if (!groups[key]) groups[key] = [];
    groups[key].push(animal);
  });

  // Order: named farms first (sorted by name), then unassigned
  const farmKeys = Object.keys(groups).filter(k => k !== 'unassigned');
  farmKeys.sort((a, b) => {
    const nameA = farmMap[a]?.name || groups[a][0]?.farm_name || '';
    const nameB = farmMap[b]?.name || groups[b][0]?.farm_name || '';
    return nameA.localeCompare(nameB);
  });
  if (groups['unassigned']) farmKeys.push('unassigned');

  const isLoading = isLoadingAnimals || isLoadingFarms;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
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
          <p className="text-gray-600 mt-1">
            {filteredAnimals.length} animal{filteredAnimals.length !== 1 ? 's' : ''} across {farmKeys.length} group{farmKeys.length !== 1 ? 's' : ''}
          </p>
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search by ID, type, sex, or farm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter size={20} />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Animal Type</label>
                <select
                  value={filters.animal_type}
                  onChange={e => handleFilterChange('animal_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="">All Types</option>
                  {ANIMAL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sex</label>
                <select
                  value={filters.sex}
                  onChange={e => handleFilterChange('sex', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="">All</option>
                  {SEX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Health Status</label>
                <select
                  value={filters.is_healthy}
                  onChange={e => handleFilterChange('is_healthy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                >
                  <option value="">All</option>
                  <option value="true">Healthy</option>
                  <option value="false">Need Attention</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <Button variant="ghost" onClick={clearFilters}>Clear Filters</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Farm Groups */}
      {farmKeys.length === 0 ? (
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
      ) : (
        <div className="space-y-6">
          {farmKeys.map(key => {
            const isUnassigned = key === 'unassigned';
            const farmInfo = isUnassigned ? null : (farmMap[key] || null);
            const farmName = isUnassigned
              ? 'No Farm Assigned'
              : (farmInfo?.name || groups[key][0]?.farm_name || `Farm #${key}`);
            const farmAddress = farmInfo?.address || null;
            const groupAnimals = groups[key];
            const isCollapsed = collapsedFarms[key];
            const unhealthyCount = groupAnimals.filter(a => !a.is_healthy).length;

            return (
              <div key={key} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Farm header — using div not button to avoid nested <button> */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleFarm(key)}
                  onKeyDown={e => e.key === 'Enter' && toggleFarm(key)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUnassigned ? 'bg-gray-200' : 'bg-primary/10'}`}>
                      {isUnassigned
                        ? <Home size={18} className="text-gray-500" />
                        : <MapPin size={18} className="text-primary" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900">{farmName}</h2>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {groupAnimals.length} animal{groupAnimals.length !== 1 ? 's' : ''}
                        </span>
                        {unhealthyCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            {unhealthyCount} need{unhealthyCount === 1 ? 's' : ''} attention
                          </span>
                        )}
                      </div>
                      {farmAddress && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          {farmAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!isUnassigned && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => { e.stopPropagation(); navigate(`/farms/${key}`); }}
                        className="text-xs text-primary"
                      >
                        View Farm
                      </Button>
                    )}
                    {isCollapsed ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronUp size={20} className="text-gray-400" />}
                  </div>
                </div>

                {/* Animals grid */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupAnimals.map(animal => (
                      <Card key={animal.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Beef className="text-primary" size={20} />
                              </div>
                              <div>
                                <h3 className="font-semibold">ID: {animal.id}</h3>
                                <p className="text-sm text-gray-500">{animal.animal_type}</p>
                              </div>
                            </div>
                            <Badge variant={animal.is_healthy ? 'success' : 'destructive'}>
                              {animal.is_healthy ? 'Healthy' : 'Needs Attention'}
                            </Badge>
                          </div>

                          <div className="space-y-1.5 mb-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Age:</span>
                              <span className="font-medium">{animal.age} months</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sex:</span>
                              <span className="font-medium">{animal.sex}</span>
                            </div>
                            {animal.pending_vaccinations > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Pending vaccines:</span>
                                <span className="font-medium text-amber-600">{animal.pending_vaccinations}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/animals/${animal.id}`)} className="flex-1">
                              <Eye size={14} className="mr-1" /> View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/animals/edit/${animal.id}`)} className="flex-1">
                              <Edit size={14} className="mr-1" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(animal.id)} disabled={isDeleting}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}