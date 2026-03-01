import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaccinations } from '@/hooks/useVaccinations';
import { useAnimals } from '@/hooks/useAnimals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar } from 'lucide-react';

/**
 * Schedule Vaccination Page
 * Form to schedule a new vaccination
 */
export default function ScheduleVaccination() {
  const navigate = useNavigate();
  const { createSchedule, isCreating } = useVaccinations();
  const { animals, isLoadingAnimals } = useAnimals();

  const [formData, setFormData] = useState({
    animal: '',
    vaccine_name: '',
    schedule_date: '',
    notes: '',
    is_group: false,
  });

  const [errors, setErrors] = useState({});

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.is_group && !formData.animal) {
      newErrors.animal = 'Please select an animal or mark as group vaccination';
    }

    if (!formData.vaccine_name) {
      newErrors.vaccine_name = 'Vaccine name is required';
    }

    if (!formData.schedule_date) {
      newErrors.schedule_date = 'Schedule date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      vaccine_name: formData.vaccine_name,
      schedule_date: formData.schedule_date,
      notes: formData.notes || null,
      is_group: formData.is_group,
    };

    // Add animal ID only if not a group vaccination
    if (!formData.is_group && formData.animal) {
      submitData.animal = parseInt(formData.animal);
    }

    createSchedule(submitData);
  };

  // Get animals list for dropdown
  const animalsList = Array.isArray(animals) ? animals : (animals?.results || []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/vaccinations')}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Schedule Vaccination</h1>
          <p className="text-gray-600 mt-1">Plan upcoming vaccination for your livestock</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Vaccination Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Vaccination Toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="is_group"
                  name="is_group"
                  type="checkbox"
                  checked={formData.is_group}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="is_group" className="cursor-pointer">
                  This is a group vaccination
                </Label>
              </div>
              <p className="text-sm text-gray-500">
                Check this if vaccinating multiple animals together
              </p>
            </div>

            {/* Animal Selection (only if not group) */}
            {!formData.is_group && (
              <div className="space-y-2">
                <Label htmlFor="animal">
                  Select Animal <span className="text-red-500">*</span>
                </Label>
                {isLoadingAnimals ? (
                  <p className="text-sm text-gray-500">Loading animals...</p>
                ) : (
                  <select
                    id="animal"
                    name="animal"
                    value={formData.animal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select an animal</option>
                    {animalsList.map(animal => (
                      <option key={animal.id} value={animal.id}>
                        ID: {animal.id} - {animal.animal_type} ({animal.sex}, {animal.age} months)
                      </option>
                    ))}
                  </select>
                )}
                {errors.animal && (
                  <p className="text-sm text-red-500">{errors.animal}</p>
                )}
              </div>
            )}

            {/* Vaccine Name */}
            <div className="space-y-2">
              <Label htmlFor="vaccine_name">
                Vaccine Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vaccine_name"
                name="vaccine_name"
                type="text"
                placeholder="e.g., FMD, HS, PPR, Anthrax"
                value={formData.vaccine_name}
                onChange={handleChange}
                className={errors.vaccine_name ? 'border-red-500' : ''}
              />
              {errors.vaccine_name && (
                <p className="text-sm text-red-500">{errors.vaccine_name}</p>
              )}
              <p className="text-sm text-gray-500">
                Enter the name of the vaccine to be administered
              </p>
            </div>

            {/* Schedule Date */}
            <div className="space-y-2">
              <Label htmlFor="schedule_date">
                Schedule Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="schedule_date"
                name="schedule_date"
                type="date"
                min={today}
                value={formData.schedule_date}
                onChange={handleChange}
                className={errors.schedule_date ? 'border-red-500' : ''}
              />
              {errors.schedule_date && (
                <p className="text-sm text-red-500">{errors.schedule_date}</p>
              )}
              <p className="text-sm text-gray-500">
                Select the date when the vaccination should be administered
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes (Optional)
              </Label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Add any additional notes or instructions..."
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-sm text-gray-500">
                Any special instructions or reminders for this vaccination
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-medium">📋 Scheduling Tips</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                <li>Choose a date when you'll be available to administer the vaccine</li>
                <li>Consider weather conditions and animal stress levels</li>
                <li>Ensure vaccine availability before the scheduled date</li>
                <li>You can mark it as completed after administration</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? 'Scheduling...' : 'Schedule Vaccination'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vaccinations')}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Link to Recommended Vaccines */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Not sure which vaccine to use?</p>
              <p className="text-sm text-gray-600 mt-1">
                Check our recommended vaccines based on season and animal type
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/vaccinations/recommended')}
            >
              View Recommended
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
