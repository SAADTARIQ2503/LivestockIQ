import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecommendedVaccines } from '@/hooks/useVaccinations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Syringe, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS, SEASON_OPTIONS } from '@/utils/constants';

/**
 * Recommended Vaccines Page
 * Shows recommended vaccines based on filters
 */
export default function RecommendedVaccines() {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    season: '',
    species: '',
    seasonal: '',
  });

  const { vaccines, isLoading } = useRecommendedVaccines(filters);

  /**
   * Handle filter change
   */
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      season: '',
      species: '',
      seasonal: '',
    });
  };

  /**
   * Get severity badge
   */
  const getSeverityBadge = (severity) => {
    const variants = {
      High: 'destructive',
      Medium: 'warning',
      Low: 'success',
    };
    return <Badge variant={variants[severity] || 'default'}>{severity} Priority</Badge>;
  };

  const vaccinesList = Array.isArray(vaccines) ? vaccines : (vaccines?.results || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/vaccinations')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Recommended Vaccines</h1>
            <p className="text-gray-600 mt-1">Essential vaccines for your livestock</p>
          </div>
        </div>
        <Button onClick={() => navigate('/vaccinations/schedule')}>
          Schedule Vaccination
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Season Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Season</label>
              <select
                value={filters.season}
                onChange={(e) => handleFilterChange('season', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="">All Seasons</option>
                {SEASON_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Species Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Animal Type</label>
              <select
                value={filters.species}
                onChange={(e) => handleFilterChange('species', e.target.value)}
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

            {/* Seasonal Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Vaccine Type</label>
              <select
                value={filters.seasonal}
                onChange={(e) => handleFilterChange('seasonal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="">All Vaccines</option>
                <option value="true">Seasonal Only</option>
                <option value="false">Year-Round Only</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.season || filters.species || filters.seasonal) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {vaccinesList.length} vaccine{vaccinesList.length !== 1 ? 's' : ''}
      </div>

      {/* Vaccines List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vaccines...</p>
          </div>
        </div>
      ) : vaccinesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaccinesList.map((vaccine, index) => (
            <Card key={vaccine.id || index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Syringe className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{vaccine.vaccine_name}</h3>
                      <p className="text-sm text-gray-600">{vaccine.disease}</p>
                    </div>
                  </div>
                  {getSeverityBadge(vaccine.severity)}
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  {/* Species */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Animal Type:</span>
                    <span className="font-medium">{vaccine.species}</span>
                  </div>

                  {/* Season */}
                  {vaccine.season && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-600">Season:</span>
                      <span className="font-medium">{vaccine.season}</span>
                    </div>
                  )}

                  {/* Seasonal Badge */}
                  {vaccine.seasonal && (
                    <Badge variant="info">Seasonal Vaccine</Badge>
                  )}

                  {/* Description */}
                  {vaccine.description && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-700">{vaccine.description}</p>
                    </div>
                  )}

                  {/* Dosage */}
                  {vaccine.dosage && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-900">Dosage</p>
                      <p className="text-sm text-blue-700 mt-1">{vaccine.dosage}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {vaccine.notes && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-800">{vaccine.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action */}
                <Button
                  className="w-full"
                  onClick={() => navigate('/vaccinations/schedule')}
                >
                  <Calendar size={16} className="mr-2" />
                  Schedule This Vaccine
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Syringe className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No vaccines found</h3>
            <p className="text-gray-600 mb-4">
              {filters.season || filters.species || filters.seasonal
                ? 'Try adjusting your filters to see more results'
                : 'No recommended vaccines available at the moment'}
            </p>
            {(filters.season || filters.species || filters.seasonal) && (
              <Button onClick={clearFilters}>Clear Filters</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Box */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Vaccination Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">1</span>
              </div>
              <p className="text-gray-700">
                <strong>Follow Schedule:</strong> Administer vaccines according to the recommended timeline for best protection
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">2</span>
              </div>
              <p className="text-gray-700">
                <strong>Proper Storage:</strong> Store vaccines at the correct temperature as specified by the manufacturer
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">3</span>
              </div>
              <p className="text-gray-700">
                <strong>Record Keeping:</strong> Maintain accurate records of all vaccinations administered
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold">4</span>
              </div>
              <p className="text-gray-700">
                <strong>Consult Veterinarian:</strong> Always consult with a veterinarian for specific vaccination protocols
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
