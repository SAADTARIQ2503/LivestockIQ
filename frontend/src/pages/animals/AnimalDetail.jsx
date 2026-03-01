import { useNavigate, useParams } from 'react-router-dom';
import { useAnimal, useAnimals } from '@/hooks/useAnimals';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Beef, Calendar, Syringe } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

/**
 * Animal Detail Page
 * Shows detailed information about a single animal
 */
export default function AnimalDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { animal, isLoading } = useAnimal(id);
  const { deleteAnimal, isDeleting } = useAnimals();

  /**
   * Handle delete animal
   */
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this animal? This action cannot be undone.')) {
      deleteAnimal(parseInt(id), {
        onSuccess: () => {
          navigate('/animals');
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading animal details...</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Animal not found</h2>
          <p className="text-gray-600 mb-4">The animal you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/animals')}>
            Back to Animals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/animals')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Animal Details</h1>
            <p className="text-gray-600 mt-1">ID: {animal.id}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/animals/edit/${id}`)}
          >
            <Edit size={16} className="mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} className="mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Beef className="text-primary" size={32} />
              </div>
              <div>
                <CardTitle className="text-2xl">{animal.animal_type}</CardTitle>
                <p className="text-gray-600 mt-1">Animal ID: {animal.id}</p>
              </div>
            </div>
            <Badge variant={animal.is_healthy ? 'success' : 'destructive'} className="text-base px-4 py-1">
              {animal.is_healthy ? 'Healthy' : 'Need Attention'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Animal Type:</span>
                  <span className="font-semibold">{animal.animal_type}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-semibold">{animal.age} months</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Sex:</span>
                  <span className="font-semibold">{animal.sex}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Health Status:</span>
                  <Badge variant={animal.is_healthy ? 'success' : 'destructive'}>
                    {animal.is_healthy ? 'Healthy' : 'Need Attention'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Health & Vaccination */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Health & Vaccination</h3>
              
              <div className="space-y-3">
                {animal.vaccine_name ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <Syringe className="text-green-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-green-900">Vaccinated</p>
                        <p className="text-sm text-green-700 mt-1">
                          Vaccine: {animal.vaccine_name}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Syringe className="text-yellow-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-yellow-900">No Vaccination Record</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          No vaccine has been administered yet
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {animal.created_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-4">
                    <Calendar size={16} />
                    <span>Added on {formatDate(animal.created_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Age Category</p>
              <p className="text-2xl font-bold">
                {animal.age < 6 ? 'Young' : animal.age < 24 ? 'Adult' : 'Mature'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Health Score</p>
              <p className={`text-2xl font-bold ${animal.is_healthy ? 'text-green-600' : 'text-red-600'}`}>
                {animal.is_healthy ? '100%' : '60%'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Vaccination Status</p>
              <p className={`text-2xl font-bold ${animal.vaccine_name ? 'text-green-600' : 'text-yellow-600'}`}>
                {animal.vaccine_name ? 'Complete' : 'Pending'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Care Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Care Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!animal.is_healthy && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="font-medium text-red-900">⚠️ Attention Required</p>
                <p className="text-sm text-red-700 mt-1">
                  This animal requires veterinary attention. Please schedule a check-up as soon as possible.
                </p>
              </div>
            )}

            {!animal.vaccine_name && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="font-medium text-yellow-900">💉 Vaccination Needed</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider scheduling vaccination for this {animal.animal_type.toLowerCase()}. 
                  Check recommended vaccines for {animal.animal_type.toLowerCase()}s.
                </p>
              </div>
            )}

            {animal.is_healthy && animal.vaccine_name && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-900">✅ All Good!</p>
                <p className="text-sm text-green-700 mt-1">
                  This animal is healthy and vaccinated. Continue with regular care and monitoring.
                </p>
              </div>
            )}

            {/* Age-based recommendations */}
            {animal.age < 6 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900">🍼 Young Animal Care</p>
                <p className="text-sm text-blue-700 mt-1">
                  This is a young {animal.animal_type.toLowerCase()}. Ensure proper nutrition, 
                  regular health checks, and age-appropriate vaccinations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/animals/edit/${id}`)}
              className="w-full"
            >
              <Edit size={16} className="mr-2" />
              Edit Information
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/vaccinations/schedule')}
              className="w-full"
            >
              <Syringe size={16} className="mr-2" />
              Schedule Vaccination
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/animals')}
              className="w-full"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
