import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { mortalityAPI } from '@/api/mortality';
import { farmsAPI } from '@/api/farms';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StatCard from '@/components/shared/StatCard';
import { Plus, Trash2, Skull, AlertTriangle, Calendar, Filter } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

const CAUSE_COLORS = {
  disease: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  accident: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  natural: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  predator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  unknown: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  other: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function MortalityTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [selectedFarm, setSelectedFarm] = useState('');

  const { data: farmsData } = useQuery({
    queryKey: ['farms'],
    queryFn: farmsAPI.getAll,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['mortality', 'summary'],
    queryFn: mortalityAPI.getSummary,
  });

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['mortality', selectedFarm],
    queryFn: () => mortalityAPI.getAll(selectedFarm ? { farm: selectedFarm } : {}),
  });

  const deleteMutation = useMutation({
    mutationFn: mortalityAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mortality'] });
      addNotification({ type: 'success', message: 'Record deleted.' });
    },
  });

  const farms = farmsData?.data?.results ?? farmsData?.data ?? [];
  const summary = summaryData?.data;
  const records = recordsData?.data?.results ?? recordsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mortality Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and analyze animal deaths across your farms.</p>
        </div>
        <button
          onClick={() => navigate('/mortality/add')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} /> Log Death
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Deaths" value={summary?.total ?? 0} icon={Skull} color="red" />
        <StatCard title="This Month" value={summary?.this_month ?? 0} icon={Calendar} color="orange" />
        <StatCard title="Last 30 Days" value={summary?.last_30_days ?? 0} icon={AlertTriangle} color="yellow" />
      </div>

      {/* By Cause & By Farm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Deaths by Cause</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.by_cause?.length ? (
              <div className="space-y-3">
                {summary.by_cause.map((item) => (
                  <div key={item.cause_of_death} className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${CAUSE_COLORS[item.cause_of_death] ?? 'bg-gray-100 text-gray-700'}`}>
                      {item.cause_of_death}
                    </span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${summary.total ? (item.count / summary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No records yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Deaths by Farm</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.by_farm?.length ? (
              <div className="space-y-3">
                {summary.by_farm.map((item) => (
                  <div key={item.farm_id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{item.farm__name}</span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${summary.total ? (item.count / summary.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No records yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-gray-900 dark:text-white">Mortality Records</CardTitle>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={selectedFarm}
                onChange={(e) => setSelectedFarm(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Farms</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Skull size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No mortality records found.</p>
              <button
                onClick={() => navigate('/mortality/add')}
                className="mt-3 text-primary hover:underline text-sm"
              >
                Log the first record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['Animal', 'Tag', 'Farm', 'Cause', 'Date', 'Age', 'Weight (kg)', 'Notes', ''].map((h) => (
                      <th key={h} className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white capitalize">{r.animal_type}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{r.animal_tag || '—'}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{r.farm_name}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${CAUSE_COLORS[r.cause_of_death] ?? ''}`}>
                          {r.cause_display}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{r.date_of_death}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{r.age_at_death}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{r.weight_at_death ?? '—'}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{r.notes || '—'}</td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => {
                            if (confirm('Delete this record?')) deleteMutation.mutate(r.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
