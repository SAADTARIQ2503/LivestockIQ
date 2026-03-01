import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCosts } from '@/hooks/useCosts';
import { useAnimals } from '@/hooks/useAnimals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, DollarSign } from 'lucide-react';

/**
 * Add Transaction Page
 * Form to add expense or revenue
 */
export default function AddTransaction() {
  const navigate = useNavigate();
  const { createTransaction, isCreating } = useCosts();
  const { animals, isLoadingAnimals } = useAnimals();

  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    animal: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Category options based on type
  const expenseCategories = [
    'Feed',
    'Medication',
    'Veterinary',
    'Labor',
    'Equipment',
    'Transportation',
    'Utilities',
    'Maintenance',
    'Insurance',
    'Other',
  ];

  const revenueCategories = [
    'Milk Sales',
    'Meat Sales',
    'Animal Sales',
    'Breeding Services',
    'Wool/Fiber Sales',
    'Other',
  ];

  const categories = formData.type === 'expense' ? expenseCategories : revenueCategories;

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset category when type changes
      ...(name === 'type' ? { category: '' } : {}),
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

    if (!formData.type) {
      newErrors.type = 'Transaction type is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
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
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description || null,
      date: formData.date,
      animal: formData.animal ? parseInt(formData.animal) : null,
      notes: formData.notes || null,
    };

    createTransaction(submitData);
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
          onClick={() => navigate('/costs')}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Transaction</h1>
          <p className="text-gray-600 mt-1">Record an expense or revenue</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={20} />
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Transaction Type <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Expense</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="revenue"
                    checked={formData.type === 'revenue'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Revenue</span>
                </label>
              </div>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`pl-7 ${errors.amount ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                type="text"
                placeholder="Brief description of transaction"
                value={formData.description}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500">
                Optional: Provide a short description
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Animal (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="animal">
                Related Animal (Optional)
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
                  <option value="">None (General transaction)</option>
                  {animalsList.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      ID: {animal.id} - {animal.animal_type} ({animal.sex}, {animal.age} months)
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-500">
                Link this transaction to a specific animal if applicable
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
                placeholder="Any additional notes or details..."
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? 'Adding...' : 'Add Transaction'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/costs')}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="font-medium text-sm">💡 Tips for Recording Transactions</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Be specific with categories for better reporting</li>
              <li>Link transactions to animals for per-animal cost tracking</li>
              <li>Add notes for important details you might need later</li>
              <li>Record transactions regularly for accurate financial tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
