import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimals } from '@/hooks/useAnimals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ANIMAL_TYPE_OPTIONS, SEX_OPTIONS } from '@/utils/constants';

/**
 * Add Animal Page
 * Form to add a new animal
 */
export default function AddAnimal() {
  const navigate = useNavigate();
  const { createAnimal, isCreating } = useAnimals();

  const [formData, setFormData] = useState({
    animal_type: '',
    age: '',
    sex: '',
    is_healthy: true,
    vaccine_name: '',
  });

  const [errors, setErrors] = useState({});

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

    if (!formData.animal_type) {
      newErrors.animal_type = 'Animal type is required';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || parseInt(formData.age) < 0) {
      newErrors.age = 'Age must be a valid positive number';
    }

    if (!formData.sex) {
      newErrors.sex = 'Sex is required';
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

    // Convert age to number
    const submitData = {
      ...formData,
      age: parseInt(formData.age),
      vaccine_name: formData.vaccine_name || null,
    };

    createAnimal(submitData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/animals')}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Animal</h1>
          <p className="text-gray-600 mt-1">Register a new animal to your livestock</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Animal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select animal type</option>
                {ANIMAL_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.animal_type && (
                <p className="text-sm text-red-500">{errors.animal_type}</p>
              )}
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
                min="0"
                placeholder="Enter age in months"
                value={formData.age}
                onChange={handleChange}
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age}</p>
              )}
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
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select sex</option>
                {SEX_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.sex && (
                <p className="text-sm text-red-500">{errors.sex}</p>
              )}
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
                Uncheck if the animal requires attention
              </p>
            </div>

            {/* Vaccine Name (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="vaccine_name">
                Vaccine Name (Optional)
              </Label>
              <Input
                id="vaccine_name"
                name="vaccine_name"
                type="text"
                placeholder="Enter vaccine name if applicable"
                value={formData.vaccine_name}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500">
                Leave empty if no vaccine has been administered yet
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isCreating}
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
