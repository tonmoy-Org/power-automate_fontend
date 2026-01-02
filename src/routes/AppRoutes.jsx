import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/login/Login';
import { useAuth } from '../auth/AuthProvider';
import { PrivateRoute } from '../auth/PrivateRoute';

import { SuperAdminLayout } from '../pages/superadmin/components/SuperAdminLayout';
import { ManagerLayout } from '../pages/manager/components/ManagerLayout';
import { TechLayout } from '../pages/tech/components/TechLayout';

import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard';
import { SuperAdminProfile } from '../pages/superadmin/Profile';
import { UserManagement } from '../pages/superadmin/UserManagement';

import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { ManagerProfile } from '../pages/manager/Profile';

import { TechDashboard } from '../pages/tech/TechDashboard';
import { TechProfile } from '../pages/tech/Profile';
import { VehicleTools } from '../pages/manager/vehicle-tools/VehicleTools';
import VehicleList from '../pages/manager/vehicle-tools/VehicleList';
import VehicleForm from '../pages/manager/vehicle-tools/VehicleForm';
import VehicleDetails from '../pages/manager/vehicle-tools/VehicleDetails';
import { TechUserManagement } from '../pages/manager/TechUserManagement';
import { ErrorPage } from '../pages/error/ErrorPage';
import Locates from '../pages/manager/Locates/Locates';


export const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Error Routes */}
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/unauthorized" element={<ErrorPage type="unauthorized" />} />
        <Route path="/not-found" element={<ErrorPage type="not-found" />} />
        <Route path="/server-error" element={<ErrorPage type="server-error" />} />

        {/* Dashboard Redirect */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              {user?.role === 'superadmin' && <Navigate to="/superadmin-dashboard" replace />}
              {user?.role === 'manager' && <Navigate to="/manager-dashboard" replace />}
              {user?.role === 'tech' && <Navigate to="/tech-dashboard" replace />}
            </PrivateRoute>
          }
        />

        {/* Super Admin Routes */}
        <Route
          path="/superadmin-dashboard"
          element={
            <PrivateRoute requiredRoles={['superadmin']}>
              <SuperAdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="profile" element={<SuperAdminProfile />} />
        </Route>

        {/* Manager Routes */}
        <Route
          path="/manager-dashboard"
          element={
            <PrivateRoute requiredRoles={['manager']}>
              <ManagerLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<ManagerDashboard />} />
          <Route path="profile" element={<ManagerProfile />} />
          <Route path="techs" element={<TechUserManagement />} />
          <Route path="locates" element={<Locates />} />

          {/* 🚛 VEHICLE & TOOLS ROUTES */}
          <Route path="vehicles" element={<VehicleTools />}>
            <Route index element={<VehicleList />} />
            <Route path="new" element={<VehicleForm />} />
            <Route path=":vehicleId" element={<VehicleDetails />} />
            <Route path=":vehicleId/edit" element={<VehicleForm />} />
          </Route>
        </Route>

        {/* Tech Routes */}
        <Route
          path="/tech-dashboard"
          element={
            <PrivateRoute requiredRoles={['tech']}>
              <TechLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<TechDashboard />} />
          <Route path="profile" element={<TechProfile />} />
        </Route>

        {/* Fallback Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<ErrorPage type="not-found" />} />
      </Routes>
    </Router>
  );
};