import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import Toast from './components/shared/Toast';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import AnimalsList from './pages/animals/AnimalsList';
import AddAnimal from './pages/animals/AddAnimal';
import EditAnimal from './pages/animals/EditAnimal';
import AnimalDetail from './pages/animals/AnimalDetail';
import VaccinationsList from './pages/vaccinations/VaccinationsList';
import ScheduleVaccination from './pages/vaccinations/ScheduleVaccination';
import VaccineRecommendations from './pages/vaccinations/RecommendedVaccines.jsx';
import Environment from './pages/environment/Environment';
import CostTracker from './pages/costs/CostTracker';
import AddTransaction from './pages/costs/AddTransaction';
import FinancialReport from './pages/costs/FinancialReport';
import AlertsList from './pages/alerts/AlertsList';
import AIDetection from './pages/ai-detection/AIDetection';
import DetectionHistory from './pages/ai-detection/DetectionHistory';

import MortalityTracker from './pages/mortality/MortalityTracker';
import AddMortality from './pages/mortality/AddMortality';

// New pages
import FarmsList from './pages/farms/FarmsList';
import AddFarm from './pages/farms/AddFarm';
import EditFarm from './pages/farms/EditFarm';
import FarmDetail from './pages/farms/FarmDetail';
import Profile from './pages/profile/Profile';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toast />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Farms */}
            <Route path="farms"           element={<FarmsList />} />
            <Route path="farms/add"       element={<AddFarm />} />
            <Route path="farms/:id"       element={<FarmDetail />} />
            <Route path="farms/:id/edit"  element={<EditFarm />} />

            {/* Animals */}
            <Route path="animals"          element={<AnimalsList />} />
            <Route path="animals/add"      element={<AddAnimal />} />
            <Route path="animals/edit/:id" element={<EditAnimal />} />
            <Route path="animals/:id"      element={<AnimalDetail />} />

            {/* Vaccinations */}
            <Route path="vaccinations"             element={<VaccinationsList />} />
            <Route path="vaccinations/schedule"    element={<ScheduleVaccination />} />
            <Route path="vaccinations/recommended" element={<VaccineRecommendations />} />

            {/* Environment */}
            <Route path="environment" element={<Environment />} />

            {/* Costs */}
            <Route path="costs"        element={<CostTracker />} />
            <Route path="costs/add"    element={<AddTransaction />} />
            <Route path="costs/report" element={<FinancialReport />} />

            {/* Alerts */}
            <Route path="alerts" element={<AlertsList />} />

            {/* AI Detection */}
            <Route path="ai-detection"         element={<AIDetection />} />
            <Route path="ai-detection/history" element={<DetectionHistory />} />

            {/* Mortality */}
            <Route path="mortality"     element={<MortalityTracker />} />
            <Route path="mortality/add" element={<AddMortality />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a href="/dashboard" className="text-primary hover:underline">Go to Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;