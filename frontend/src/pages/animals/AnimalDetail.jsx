import { useNavigate, useParams } from 'react-router-dom';
import { useAnimal, useAnimals } from '@/hooks/useAnimals';
import { useVaccinations } from '@/hooks/useVaccinations';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Edit, Trash2, Beef, Calendar, Syringe,
  MapPin, CheckCircle, Clock, AlertCircle, Skull, X
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { mortalityAPI } from '@/api/mortality';
import { useNotificationStore } from '@/store/notificationStore';

/**
 * Animal Detail Page
 * Shows detailed information about a single animal including vaccination history
 */
export default function AnimalDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { animal, isLoading } = useAnimal(id);
  const { deleteAnimal, isDeleting } = useAnimals();
  const { markCompleted, isMarkingCompleted } = useVaccinations();
  const { addNotification } = useNotificationStore();

  const [showDeadModal, setShowDeadModal] = useState(false);
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
      deleteAnimal(parseInt(id), { onSuccess: () => navigate('/animals') });
    },
    onError: (err) => {
      addNotification({ type: 'error', message: err.response?.data?.detail || 'Failed to save record.' });
    },
  });

  const handleMarkDead = (e) => {
    e.preventDefault();
    if (!animal) return;
    const payload = {
      farm: animal.farm,
      animal: animal.id,
      animal_type: animal.animal_type,
      animal_tag: deadForm.animal_tag || null,
      cause_of_death: deadForm.cause_of_death,
      date_of_death: deadForm.date_of_death,
      age_at_death: `${animal.age} months`,
      weight_at_death: deadForm.weight_at_death || null,
      notes: deadForm.notes || null,
    };
    markDeadMutation.mutate(payload);
  };

  const handleMarkComplete = (scheduleId) => {
    if (window.confirm('Mark this vaccination as completed?')) {
      markCompleted(scheduleId, {
        onSuccess: () => {
          // Invalidate this animal's detail query so vaccination history refreshes
          queryClient.invalidateQueries({ queryKey: ['animal', id] });
          queryClient.invalidateQueries({ queryKey: ['animal', parseInt(id)] });
        }
      });
    }
  };

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

  /**
   * Get vaccination status badge
   */
  const getVaccinationBadge = (vaccination) => {
    if (vaccination.is_completed) {
      return <Badge variant="success" className="text-xs">Completed</Badge>;
    }
    
    const scheduleDate = new Date(vaccination.schedule_date);
    const today = new Date();
    
    if (scheduleDate < today) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    }
    
    return <Badge variant="warning" className="text-xs">Scheduled</Badge>;
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

  const vaccinationHistory = animal.vaccination_history || [];
  const vaccinationStatus = animal.vaccination_status || { total: 0, completed: 0, pending: 0 };

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
            <p className="text-gray-600 mt-1">Animal #{animal.user_animal_id ?? animal.id}</p>
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
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => setShowDeadModal(true)}
          >
            <Skull size={16} className="mr-2" />
            Mark as Dead
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
                <p className="text-gray-600 mt-1">Animal #{animal.user_animal_id ?? animal.id}</p>
                {/* NEW: Farm name display */}
                {animal.farm_name && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} />
                    {animal.farm_name}
                  </p>
                )}
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

                {/* NEW: Required Vaccine */}
                {animal.required_vaccine && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Required Vaccine:</span>
                    <span className="font-semibold text-sm">{animal.required_vaccine}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vaccination Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Vaccination Summary</h3>
              
              <div className="space-y-3">
                {/* Vaccination Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{vaccinationStatus.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{vaccinationStatus.completed}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-600">{vaccinationStatus.pending}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>

                {/* Status Badge */}
                {vaccinationStatus.fully_vaccinated ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-green-900">Fully Vaccinated</p>
                        <p className="text-sm text-green-700 mt-1">
                          All scheduled vaccinations completed
                        </p>
                      </div>
                    </div>
                  </div>
                ) : vaccinationStatus.overdue > 0 ? (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-red-900">Overdue Vaccinations</p>
                        <p className="text-sm text-red-700 mt-1">
                          {vaccinationStatus.overdue} vaccination{vaccinationStatus.overdue > 1 ? 's' : ''} overdue
                        </p>
                      </div>
                    </div>
                  </div>
                ) : vaccinationStatus.pending > 0 ? (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Clock className="text-yellow-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-yellow-900">Pending Vaccinations</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {vaccinationStatus.pending} vaccination{vaccinationStatus.pending > 1 ? 's' : ''} scheduled
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Syringe className="text-gray-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">No Vaccinations</p>
                        <p className="text-sm text-gray-700 mt-1">
                          No vaccination records found
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NEW: Vaccination History */}
      {vaccinationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe size={20} />
              Vaccination History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccinationHistory.map((vaccination) => (
                <div
                  key={vaccination.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      vaccination.is_completed 
                        ? 'bg-green-100' 
                        : new Date(vaccination.schedule_date) < new Date()
                          ? 'bg-red-100'
                          : 'bg-yellow-100'
                    }`}>
                      <Syringe 
                        size={20} 
                        className={
                          vaccination.is_completed 
                            ? 'text-green-600' 
                            : new Date(vaccination.schedule_date) < new Date()
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        } 
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{vaccination.vaccine_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(vaccination.schedule_date)}
                      </p>
                      {vaccination.dose_notes && (
                        <p className="text-xs text-gray-500 mt-1">{vaccination.dose_notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getVaccinationBadge(vaccination)}
                    {!vaccination.is_completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkComplete(vaccination.id)}
                        disabled={isMarkingCompleted}
                        className="text-xs h-7 px-2 text-green-700 border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle size={12} className="mr-1" />
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <p className="text-sm text-gray-600 mb-2">Vaccination Progress</p>
              <p className={`text-2xl font-bold ${
                vaccinationStatus.fully_vaccinated ? 'text-green-600' : 
                vaccinationStatus.pending > 0 ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {vaccinationStatus.total > 0 
                  ? `${Math.round((vaccinationStatus.completed / vaccinationStatus.total) * 100)}%`
                  : 'N/A'
                }
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
                  This animal requires veterinary attention. Required vaccine: {animal.required_vaccine}
                </p>
              </div>
            )}

            {vaccinationStatus.overdue > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-900">📅 Overdue Vaccinations</p>
                <p className="text-sm text-orange-700 mt-1">
                  {vaccinationStatus.overdue} vaccination{vaccinationStatus.overdue > 1 ? 's are' : ' is'} overdue. 
                  Please schedule veterinary visit immediately.
                </p>
              </div>
            )}

            {animal.is_healthy && vaccinationStatus.fully_vaccinated && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-900">✅ All Good!</p>
                <p className="text-sm text-green-700 mt-1">
                  This animal is healthy and fully vaccinated. Continue with regular care and monitoring.
                </p>
              </div>
            )}

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

      {/* Mark as Dead Modal */}
      {showDeadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Skull size={20} className="text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mark Animal as Dead</h2>
              </div>
              <button onClick={() => setShowDeadModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleMarkDead} className="p-5 space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                This will log a mortality record for <strong>{animal?.animal_type} #{animal?.id}</strong> and remove it from your animals list.
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
                  onClick={() => setShowDeadModal(false)}
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