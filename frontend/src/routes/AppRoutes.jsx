import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import AnimalsList from '@/pages/animals/AnimalsList';
import AddAnimal from '@/pages/animals/AddAnimal';
import VaccinationSchedule from '@/pages/health/VaccinationSchedule';
import RecommendedVaccines from '@/pages/health/RecommendedVaccines';
import Layout from '@/components/layout/Layout';
import NotFound from '@/pages/NotFound';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
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
          <Route path="animals" element={<AnimalsList />} />
          <Route path="animals/add" element={<AddAnimal />} />
          <Route path="vaccinations" element={<VaccinationSchedule />} />
          <Route path="vaccines/recommended" element={<RecommendedVaccines />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};