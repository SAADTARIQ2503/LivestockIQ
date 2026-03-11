import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mortalityAPI } from '@/api/mortality';
import { farmsAPI } from '@/api/farms';
import { animalsAPI } from '@/api/animals';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

export default function AddMortality() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  const [form, setForm] = useState({
    farm: '',
    animal: '',
    animal_type: '',
    animal_tag: '',
    cause_of_death: '',
    date_of_death: new Date().toISOString().split('T')[0],
    age_at_death: '',
    weight_at_death: '',
    notes: '',
  });

  const { data: farmsData } = useQuery({ queryKey: ['farms'], queryFn: farmsAPI.getAll });
  const { data: animalsData } = useQuery({
    queryKey: ['animals', form.farm],
    queryFn: () => animalsAPI.getAll({ farm: form.farm }),
    enabled: !!form.farm,
  });

  const farms = farmsData?.data?.results ?? farmsData?.data ?? [];
  const animals = animalsData?.data?.results ?? animalsData?.data ?? [];

  const mutation = useMutation({
    mutationFn: mortalityAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortality'] });
      addNotification({ type: 'success', message: 'Mortality record logged.' });
      navigate('/mortality');
    },
    onError: (err) => {
      addNotification({ type: 'error', message: err.response?.data?.detail || 'Failed to save record.' });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-fill animal_type when an animal is selected
      if (name === 'animal' && value) {
        const chosen = animals.find((a) => String(a.id) === value);
        if (chosen) updated.animal_type = chosen.animal_type;
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.animal) delete payload.animal;
    if (!payload.weight_at_death) delete payload.weight_at_death;
    mutation.mutate(payload);
  };

  const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/mortality')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Animal Death</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Record a mortality event for your livestock.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Mortality Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Farm */}
              <div>
                <label className={labelCls}>Farm *</label>
                <select name="farm" value={form.farm} onChange={handleChange} required className={inputCls}>
                  <option value="">Select farm</option>
                  {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              {/* Animal (optional) */}
              <div>
                <label className={labelCls}>Animal (optional)</label>
                <select name="animal" value={form.animal} onChange={handleChange} className={inputCls} disabled={!form.farm}>
                  <option value="">Select animal</option>
                  {animals.map((a) => <option key={a.id} value={a.id}>#{a.id} — {a.animal_type}</option>)}
                </select>
              </div>

              {/* Animal Type */}
              <div>
                <label className={labelCls}>Animal Type *</label>
                <input name="animal_type" value={form.animal_type} onChange={handleChange} required className={inputCls} placeholder="e.g. Cow, Goat, Sheep" />
              </div>

              {/* Animal Tag */}
              <div>
                <label className={labelCls}>Animal Tag / Name</label>
                <input name="animal_tag" value={form.animal_tag} onChange={handleChange} className={inputCls} placeholder="Optional identifier" />
              </div>

              {/* Cause of Death */}
              <div>
                <label className={labelCls}>Cause of Death *</label>
                <select name="cause_of_death" value={form.cause_of_death} onChange={handleChange} required className={inputCls}>
                  <option value="">Select cause</option>
                  <option value="disease">Disease</option>
                  <option value="accident">Accident</option>
                  <option value="natural">Natural Causes</option>
                  <option value="predator">Predator Attack</option>
                  <option value="unknown">Unknown</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date of Death */}
              <div>
                <label className={labelCls}>Date of Death *</label>
                <input type="date" name="date_of_death" value={form.date_of_death} onChange={handleChange} required className={inputCls} />
              </div>

              {/* Age at Death */}
              <div>
                <label className={labelCls}>Age at Death *</label>
                <input name="age_at_death" value={form.age_at_death} onChange={handleChange} required className={inputCls} placeholder="e.g. 2 years, 6 months" />
              </div>

              {/* Weight */}
              <div>
                <label className={labelCls}>Weight at Death (kg)</label>
                <input type="number" step="0.1" name="weight_at_death" value={form.weight_at_death} onChange={handleChange} className={inputCls} placeholder="Optional" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputCls} placeholder="Any additional observations..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/mortality')} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={mutation.isPending} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium">
                {mutation.isPending ? 'Saving...' : 'Log Death'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
