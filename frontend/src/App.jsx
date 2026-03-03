import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import Toast from './components/shared/Toast';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AnimalsList from './pages/animals/AnimalsList';
import AddAnimal from './pages/animals/AddAnimal';
import Dashboard from './pages/dashboard/Dashboard';
import Layout from './components/layout/Layout';
import VaccinationsList from './pages/vaccinations/VaccinationsList';
import ScheduleVaccination from './pages/vaccinations/ScheduleVaccination';
import RecommendedVaccines from './pages/vaccinations/RecommendedVaccines'; 
import Environment from './pages/environment/Environment';
import EditAnimal from './pages/animals/EditAnimal';
import AnimalDetail from './pages/animals/AnimalDetail';
import CostTracker from './pages/costs/CostTracker';
import AddTransaction from './pages/costs/AddTransaction';
import FinancialReport from './pages/costs/FinancialReport';
import AlertsList from './pages/alerts/AlertsList';
import AIDetection from './pages/ai-detection/AIDetection';
import DetectionHistory from './pages/ai-detection/DetectionHistory';

import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Main App Component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toast />
        <Routes>
          {/* Public Routes (Login/Register) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes (Dashboard and Apps) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Future routes */}
            <Route path="animals" element={<AnimalsList />} />
            <Route path="animals/add" element={<AddAnimal />} />
            <Route path="animals/edit/:id" element={<EditAnimal />} />
            <Route path="animals/:id" element={<AnimalDetail />} />

            {/* Vaccinations routes */}
            <Route path="vaccinations" element={<VaccinationsList />} />
            <Route path="vaccinations/schedule" element={<ScheduleVaccination />} />
            <Route path="vaccinations/recommended" element={<RecommendedVaccines />} />
            
            {/* Environment routes */}
            <Route path="environment" element={<Environment />} />


            <Route path="costs" element={<CostTracker />} />
            <Route path="costs/add" element={<AddTransaction />} />
            <Route path="costs/report" element={<FinancialReport />} />

            
            
              {/* Alerts routes */}
              <Route path="alerts" element={<AlertsList />} />

              {/* AI Detection routes */}
              <Route path="ai-detection" element={<AIDetection />} />
              <Route path="ai-detection/history" element={<DetectionHistory />} />


            
            {/* <Route path="vaccinations" element={<Vaccinations />} /> */}
            {/* <Route path="environment" element={<Environment />} /> */}
            {/* <Route path="alerts" element={<Alerts />} /> */}
            {/* <Route path="costs" element={<CostCalculator />} /> */}
          </Route>

          {/* 404 - Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Page not found</p>
                  <a href="/login" className="text-primary hover:underline">
                    Go to Login
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
