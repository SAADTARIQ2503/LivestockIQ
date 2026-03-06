import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/utils/constants';
import { authAPI } from '@/api/auth';
import StatCard from '@/components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Beef, Heart, AlertTriangle, Syringe } from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useUIStore } from '@/store/uiStore';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const { data: stats, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.auth.dashboard,
    queryFn: authAPI.getDashboardStats,
  });

  const dashboardData = stats?.data;

  // Chart colors that work in both light and dark mode
  const chartTextColor = isDark ? '#9ca3af' : '#6b7280';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const vaccinationChartData = {
    labels: ['Vaccinated', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [
          dashboardData?.vaccinations?.completed || 0,
          dashboardData?.vaccinations?.pending || 0,
          dashboardData?.vaccinations?.overdue || 0,
        ],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const animalsByTypeData = {
    labels: dashboardData?.animals?.by_type?.map(item => item.animal_type) || [],
    datasets: [
      {
        label: 'Count',
        data: dashboardData?.animals?.by_type?.map(item => item.count) || [],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartTextColor,
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#d1d5db' : '#374151',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartTextColor,
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#d1d5db' : '#374151',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: chartTextColor },
        grid: { color: chartGridColor },
        border: { color: chartGridColor },
      },
      y: {
        ticks: { color: chartTextColor },
        grid: { color: chartGridColor },
        border: { color: chartGridColor },
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500">Failed to load dashboard data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's an overview of your livestock.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Animals"
          value={dashboardData?.animals?.total || 0}
          icon={Beef}
          color="blue"
        />
        <StatCard
          title="Healthy Animals"
          value={dashboardData?.animals?.healthy || 0}
          icon={Heart}
          color="green"
        />
        <StatCard
          title="Need Attention"
          value={dashboardData?.animals?.unhealthy || 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Upcoming Vaccinations"
          value={dashboardData?.vaccinations?.upcoming || 0}
          icon={Syringe}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vaccination Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Vaccination Status</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ✅ White bg in light mode, dark bg in dark mode — chart always readable */}
            <div className="h-64 bg-white dark:bg-gray-800 rounded-lg p-2">
              <Doughnut data={vaccinationChartData} options={doughnutOptions} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {dashboardData?.vaccinations?.completed || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {dashboardData?.vaccinations?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dashboardData?.vaccinations?.total || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animals by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Animals by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-white dark:bg-gray-800 rounded-lg p-2">
              <Bar data={animalsByTypeData} options={barOptions} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {dashboardData?.animals?.by_type?.map((item, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.count}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.animal_type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/animals/add')}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Beef className="text-primary mb-2" size={24} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Animal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Register a new animal</p>
            </button>

            <button
              onClick={() => navigate('/vaccinations/schedule')}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Syringe className="text-primary mb-2" size={24} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Schedule Vaccination</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan upcoming vaccinations</p>
            </button>

            <button
              onClick={() => navigate('/environment')}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <AlertTriangle className="text-primary mb-2" size={24} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Check Environment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View weather and conditions</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}