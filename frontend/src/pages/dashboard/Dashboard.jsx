import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/utils/constants';
import { authAPI } from '@/api/auth';
import StatCard from '@/components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Beef, Heart, AlertTriangle, Syringe } from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
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

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Dashboard Page Component
 * Main dashboard showing overview statistics and charts
 */
export default function Dashboard() {
  // Fetch dashboard statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.auth.dashboard,
    queryFn: authAPI.getDashboardStats,
  });

  const dashboardData = stats?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Failed to load dashboard data</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  // Vaccination status chart data
  const vaccinationChartData = {
    labels: ['Vaccinated', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [
          dashboardData?.vaccinations?.completed || 0,
          dashboardData?.vaccinations?.pending || 0,
          0, // Overdue count
        ],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        borderWidth: 0,
      },
    ],
  };

  // Animals by type chart data
  const animalsByTypeData = {
    labels: dashboardData?.animals?.by_type?.map(item => item.animal_type) || [],
    datasets: [
      {
        label: 'Count',
        data: dashboardData?.animals?.by_type?.map(item => item.count) || [],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">
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
            <CardTitle>Vaccination Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={vaccinationChartData} options={chartOptions} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed:</span>
                <span className="font-semibold text-green-600">
                  {dashboardData?.vaccinations?.completed || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">
                  {dashboardData?.vaccinations?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">
                  {dashboardData?.vaccinations?.total || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animals by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Animals by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={animalsByTypeData} options={chartOptions} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {dashboardData?.animals?.by_type?.map((item, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-sm text-gray-600">{item.animal_type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => (window.location.href = '/animals/add')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Beef className="text-primary mb-2" size={24} />
              <h3 className="font-semibold">Add Animal</h3>
              <p className="text-sm text-gray-600">Register a new animal</p>
            </button>

            <button
              onClick={() => (window.location.href = '/vaccinations/schedule')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Syringe className="text-primary mb-2" size={24} />
              <h3 className="font-semibold">Schedule Vaccination</h3>
              <p className="text-sm text-gray-600">Plan upcoming vaccinations</p>
            </button>

            <button
              onClick={() => (window.location.href = '/environment')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <AlertTriangle className="text-primary mb-2" size={24} />
              <h3 className="font-semibold">Check Environment</h3>
              <p className="text-sm text-gray-600">View weather and conditions</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
