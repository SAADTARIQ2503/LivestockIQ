import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '@/hooks/useAnimals';
import { useFarms } from '@/hooks/useFarms';
import { healthAPI } from '@/api/health';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Syringe, MapPin } from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS, SEX_OPTIONS } from '@/utils/constants';

export default function AddAnimal() {
  const navigate = useNavigate();
  const { createAnimal, isCreating } = useAnimals();
  const { farms, isLoadingFarms } = useFarms();

  const [formData, setFormData] = useState({
    farm: '', // NEW: Farm selection
    animal_type: '',
    age: '',
    sex: '',
    is_healthy: true,
    required_vaccine: '',
  });

  const [errors, setErrors] = useState({});

  // Vaccine dropdown state
  const [vaccines, setVaccines] = useState([]);
  const [isLoadingVaccines, setIsLoadingVaccines] = useState(false);
  const [vaccineSearch, setVaccineSearch] = useState('');

  // Load vaccines whenever animal_type changes
  useEffect(() => {
    if (!formData.animal_type) {
      setVaccines([]);
      return;
    }

    const fetchVaccines = async () => {
      setIsLoadingVaccines(true);
      setFormData(prev => ({ ...prev, required_vaccine: '' }));
      setVaccineSearch('');
      try {
        const res = await healthAPI.getVaccinesBySpecies(formData.animal_type);
        const names = res?.data?.vaccines || [];
        setVaccines(names);
      } catch (err) {
        console.error('Failed to load vaccines:', err);
        setVaccines([]);
      } finally {
        setIsLoadingVaccines(false);
      }
    };

    fetchVaccines();
  }, [formData.animal_type]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      // Clear required_vaccine when animal is marked healthy
      if (name === 'is_healthy' && checked) {
        updated.required_vaccine = '';
      }
      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleVaccineSelect = (name) => {
    setFormData(prev => ({ ...prev, required_vaccine: name }));
    setVaccineSearch('');
    if (errors.required_vaccine) {
      setErrors(prev => ({ ...prev, required_vaccine: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // NEW: Validate farm selection
    if (!formData.farm) {
      newErrors.farm = 'Please select a farm';
    }

    if (!formData.animal_type) {
      newErrors.animal_type = 'Animal type is required';
    }

    if (!formData.age && formData.age !== 0) {
      newErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || parseInt(formData.age) < 1) {
      newErrors.age = 'Age must be at least 1 month';
    } else if (parseInt(formData.age) > 600) {
      newErrors.age = 'Age seems too high — please enter age in months (max 600)';
    }

    if (!formData.sex) {
      newErrors.sex = 'Sex is required';
    }

    if (!formData.is_healthy && !formData.required_vaccine) {
      newErrors.required_vaccine = 'Please select the required vaccine for an unhealthy animal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    createAnimal({
      farm: parseInt(formData.farm), // NEW: Include farm
      animal_type: formData.animal_type,
      age: String(parseInt(formData.age)),
      sex: formData.sex,
      is_healthy: formData.is_healthy,
      required_vaccine: formData.is_healthy ? null : formData.required_vaccine,
    });
  };

  const filteredVaccines = vaccines.filter(v =>
    v.toLowerCase().includes(vaccineSearch.toLowerCase())
  );

  const farmsList = Array.isArray(farms) ? farms : (farms?.results || []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/animals')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Animal</h1>
          <p className="text-gray-600 mt-1">Register a new animal to your livestock</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Animal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Farm Selection - NEW */}
            <div className="space-y-2">
              <Label htmlFor="farm">
                Farm <span className="text-red-500">*</span>
              </Label>
              {isLoadingFarms ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-input rounded-md">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading farms...
                </div>
              ) : farmsList.length === 0 ? (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-900 font-medium mb-2">
                      ⚠️ No farms found
                    </p>
                    <p className="text-sm text-amber-700">
                      You need to create at least one farm before adding animals.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => navigate('/farms/add')}
                    className="w-full"
                  >
                    <MapPin size={16} className="mr-2" />
                    Create Your First Farm
                  </Button>
                </div>
              ) : (
                <>
                  <select
                    id="farm"
                    name="farm"
                    value={formData.farm}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.farm ? 'border-red-500' : 'border-input'
                    }`}
                  >
                    <option value="">Select a farm</option>
                    {farmsList.map(farm => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name} - {farm.address}
                      </option>
                    ))}
                  </select>
                  {errors.farm && <p className="text-sm text-red-500">{errors.farm}</p>}
                  <p className="text-sm text-gray-500">
                    Select which farm this animal belongs to
                  </p>
                </>
              )}
            </div>

            {/* Animal Type */}
            <div className="space-y-2">
              <Label htmlFor="animal_type">
                Animal Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="animal_type"
                name="animal_type"
                value={formData.animal_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.animal_type ? 'border-red-500' : 'border-input'}`}
              >
                <option value="">Select animal type</option>
                {ANIMAL_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.animal_type && <p className="text-sm text-red-500">{errors.animal_type}</p>}
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">
                Age (months) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                min="1"
                max="600"
                placeholder="Enter age in months (e.g. 24)"
                value={formData.age}
                onChange={handleChange}
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
              <p className="text-sm text-gray-500">Enter the age in months (minimum 1)</p>
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <Label htmlFor="sex">
                Sex <span className="text-red-500">*</span>
              </Label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.sex ? 'border-red-500' : 'border-input'}`}
              >
                <option value="">Select sex</option>
                {SEX_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.sex && <p className="text-sm text-red-500">{errors.sex}</p>}
            </div>

            {/* Health Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="is_healthy"
                  name="is_healthy"
                  type="checkbox"
                  checked={formData.is_healthy}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="is_healthy" className="cursor-pointer">
                  Animal is healthy
                </Label>
              </div>
              <p className="text-sm text-gray-500">
                Uncheck if the animal is sick or requires a vaccine
              </p>
            </div>

            {/* Required Vaccine — only shown when unhealthy */}
            {!formData.is_healthy && (
              <div className="space-y-2">
                <Label>
                  Required Vaccine <span className="text-red-500">*</span>
                </Label>

                {/* Selected pill */}
                {formData.required_vaccine && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/30 rounded-md">
                    <Syringe size={16} className="text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary flex-1">{formData.required_vaccine}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, required_vaccine: '' }))}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      ✕ Clear
                    </button>
                  </div>
                )}

                {!formData.animal_type ? (
                  <p className="text-sm text-amber-600 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                    ⚠️ Select an animal type first to load available vaccines
                  </p>
                ) : isLoadingVaccines ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-input rounded-md">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading vaccines for {formData.animal_type}...
                  </div>
                ) : (
                  <div className="border border-input rounded-md overflow-hidden">
                    <div className="px-3 py-2 border-b border-input bg-gray-50">
                      <Input
                        placeholder={
                          vaccines.length === 0
                            ? `No vaccines found for ${formData.animal_type}`
                            : `Search ${vaccines.length} vaccines for ${formData.animal_type}...`
                        }
                        value={vaccineSearch}
                        onChange={e => setVaccineSearch(e.target.value)}
                        className="h-8 border-0 bg-transparent focus-visible:ring-0 px-0 text-sm"
                        disabled={vaccines.length === 0}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredVaccines.length > 0 ? (
                        filteredVaccines.map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleVaccineSelect(name)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/5 transition-colors flex items-center justify-between ${
                              formData.required_vaccine === name
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {name}
                            {formData.required_vaccine === name && <span className="text-primary">✓</span>}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-4 text-sm text-gray-400 text-center">
                          {vaccines.length === 0
                            ? `No vaccines available for ${formData.animal_type}`
                            : `No vaccines match "${vaccineSearch}"`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {errors.required_vaccine && (
                  <p className="text-sm text-red-500">{errors.required_vaccine}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={isCreating || farmsList.length === 0} 
                className="flex-1"
              >
                {isCreating ? 'Adding...' : 'Add Animal'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/animals')}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}