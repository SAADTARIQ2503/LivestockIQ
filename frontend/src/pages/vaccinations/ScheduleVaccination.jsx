import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaccinations } from '@/hooks/useVaccinations';
import { useAnimals } from '@/hooks/useAnimals';
import { healthAPI } from '@/api/health';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Syringe } from 'lucide-react';

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

  // Vaccine dropdown state
  const [vaccines, setVaccines] = useState([]);
  const [isLoadingVaccines, setIsLoadingVaccines] = useState(false);
  const [vaccineSearch, setVaccineSearch] = useState('');
  const [selectedVaccineLabel, setSelectedVaccineLabel] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const animalsList = Array.isArray(animals) ? animals : (animals?.results || []);

  // Derive the selected animal's type to filter vaccines by species
  const selectedAnimal = animalsList.find(a => String(a.id) === String(formData.animal));
  const selectedSpecies = selectedAnimal?.animal_type || '';

  /**
   * Fetch vaccines whenever species changes (or on mount for group vaccinations)
   */
  useEffect(() => {
    const fetchVaccines = async () => {
      setIsLoadingVaccines(true);
      setVaccines([]);
      // Reset vaccine selection when species changes
      setFormData(prev => ({ ...prev, vaccine_name: '' }));
      setSelectedVaccineLabel('');
      try {
        let response;
        if (selectedSpecies) {
          response = await healthAPI.getVaccinesBySpecies(selectedSpecies);
          // Backend returns { species, count, results: [...vaccine objects] }
          const raw = response?.data;
          if (raw?.results && Array.isArray(raw.results)) {
            const unique = [...new Map(raw.results.map(v => [v.vaccine_name, v])).values()];
            setVaccines(unique.map(v => ({
              value: v.vaccine_name,
              label: v.vaccine_name,
              disease: v.disease_name || '',
            })));
          } else if (raw?.vaccines && Array.isArray(raw.vaccines)) {
            // Legacy flat name list fallback
            setVaccines(raw.vaccines.map(name => ({ value: name, label: name, disease: '' })));
          } else {
            setVaccines([]);
          }
        } else {
          // No species selected — load all vaccines from the list endpoint
          const listRes = await import('@/api/axios').then(m =>
            m.default.get('/health/vaccines/')
          );
          const allVaccines = listRes?.data?.results || listRes?.data || [];
          const unique = [...new Map(allVaccines.map(v => [v.vaccine_name, v])).values()];
          setVaccines(unique.map(v => ({
            value: v.vaccine_name,
            label: v.vaccine_name,
            disease: v.disease_name || '',
          })));
        }
      } catch (err) {
        console.error('Failed to load vaccines:', err);
        setVaccines([]);
      } finally {
        setIsLoadingVaccines(false);
      }
    };

    fetchVaccines();
  }, [selectedSpecies, formData.is_group]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Handle vaccine selection from dropdown
   */
  const handleVaccineSelect = (vaccineName) => {
    setFormData(prev => ({ ...prev, vaccine_name: vaccineName }));
    setSelectedVaccineLabel(vaccineName);
    setVaccineSearch('');
    if (errors.vaccine_name) {
      setErrors(prev => ({ ...prev, vaccine_name: '' }));
    }
  };

  /**
   * Filtered vaccine list based on search input
   */
  const filteredVaccines = vaccines.filter(v =>
    v.label.toLowerCase().includes(vaccineSearch.toLowerCase())
  );

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.is_group && !formData.animal) {
      newErrors.animal = 'Please select an animal or mark as group vaccination';
    }

    if (!formData.vaccine_name) {
      newErrors.vaccine_name = 'Please select a vaccine';
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

    if (!validateForm()) return;

    const submitData = {
      vaccine_name: formData.vaccine_name,
      schedule_date: formData.schedule_date,
      notes: formData.notes || null,
      is_group: formData.is_group,
    };

    if (!formData.is_group && formData.animal) {
      submitData.animal = parseInt(formData.animal);
    }

    createSchedule(submitData);
  };

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
                        #{animal.user_animal_id ?? animal.id} - {animal.animal_type} ({animal.sex}, {animal.age} months)
                      </option>
                    ))}
                  </select>
                )}
                {errors.animal && (
                  <p className="text-sm text-red-500">{errors.animal}</p>
                )}
              </div>
            )}

            {/* Vaccine Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="vaccine_name">
                Vaccine <span className="text-red-500">*</span>
              </Label>

              {/* Selected vaccine display */}
              {formData.vaccine_name && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/30 rounded-md">
                  <Syringe size={16} className="text-primary shrink-0" />
                  <span className="text-sm font-medium text-primary flex-1">{formData.vaccine_name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, vaccine_name: '' }));
                      setSelectedVaccineLabel('');
                    }}
                    className="text-gray-400 hover:text-red-500 text-xs ml-auto"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}

              {/* Search + dropdown list */}
              {isLoadingVaccines ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-input rounded-md">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading vaccines{selectedSpecies ? ` for ${selectedSpecies}` : ''}...
                </div>
              ) : (
                <div className="border border-input rounded-md overflow-hidden">
                  {/* Search bar inside dropdown */}
                  <div className="px-3 py-2 border-b border-input bg-gray-50">
                    <Input
                      placeholder={
                        vaccines.length === 0
                          ? 'No vaccines found — select an animal first'
                          : `Search ${vaccines.length} vaccine${vaccines.length !== 1 ? 's' : ''}${selectedSpecies ? ` for ${selectedSpecies}` : ''}...`
                      }
                      value={vaccineSearch}
                      onChange={e => setVaccineSearch(e.target.value)}
                      className="h-8 border-0 bg-transparent focus-visible:ring-0 px-0 text-sm"
                      disabled={vaccines.length === 0}
                    />
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredVaccines.length > 0 ? (
                      filteredVaccines.map((vaccine) => (
                        <button
                          key={vaccine.value}
                          type="button"
                          onClick={() => handleVaccineSelect(vaccine.value)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-primary/5 transition-colors ${formData.vaccine_name === vaccine.value
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-gray-700'
                            }`}
                        >
                          <span>{vaccine.label}</span>
                          {vaccine.disease && (
                            <span className="text-xs text-gray-400 ml-2 shrink-0">
                              {vaccine.disease}
                            </span>
                          )}
                          {formData.vaccine_name === vaccine.value && (
                            <span className="text-primary ml-2">✓</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-sm text-gray-400 text-center">
                        {vaccines.length === 0
                          ? 'Select an animal above to load available vaccines'
                          : `No vaccines match "${vaccineSearch}"`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Species hint */}
              {selectedSpecies && !isLoadingVaccines && (
                <p className="text-xs text-gray-500">
                  Showing vaccines for <span className="font-medium">{selectedSpecies}</span>.
                  {' '}Deselect the animal to browse all vaccines.
                </p>
              )}

              {errors.vaccine_name && (
                <p className="text-sm text-red-500">{errors.vaccine_name}</p>
              )}
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
              <Label htmlFor="notes">Notes (Optional)</Label>
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
              <Button type="submit" disabled={isCreating} className="flex-1">
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
            <Button variant="outline" onClick={() => navigate('/vaccinations/recommended')}>
              View Recommended
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}