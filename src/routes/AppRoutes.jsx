import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/login/Login';
import { useAuth } from '../auth/AuthProvider';
import { PrivateRoute } from '../auth/PrivateRoute';
import { ErrorPage } from '../pages/error/ErrorPage';

import { SuperAdminLayout } from '../pages/superadmin/components/SuperAdminLayout';
import { MemberLayout } from '../pages/member/components/MemberLayout';
import { ClientLayout } from '../pages/client/components/ClientLayout';

import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard';
import { SuperAdminProfile } from '../pages/superadmin/Profile';
import { UserManagement } from '../pages/superadmin/UserManagement';


import { MemberDashboard } from '../pages/member/MemberDashboard';
import { MemberProfile } from '../pages/member/Profile';


import { ClientDashboard } from '../pages/client/ClientDashboard';
import { ClientProfile } from '../pages/client/Profile';
import ForgotPassword from '../pages/forgot-password/ForgotPassword';
import ResetPassword from '../pages/reset-password/ResetPassword';
import Forms from '../pages/superadmin/Forms';
import PasswordFormatters from '../pages/superadmin/PasswordFormatters';
import PhoneCredential from '../pages/superadmin/PhoneCredential';





export const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
              {user?.role === 'member' && <Navigate to="/member-dashboard" replace />}
              {user?.role === 'client' && <Navigate to="/client-dashboard" replace />}
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
          <Route path="forms" element={<Forms />} />
          <Route path="password-formatters" element={<PasswordFormatters />} />
          <Route path="phone-credential" element={<PhoneCredential />} />
          <Route path="profile" element={<SuperAdminProfile />} />
        </Route>

        {/* Member Routes */}
        <Route
          path="/member-dashboard"
          element={
            <PrivateRoute requiredRoles={['member']}>
              <MemberLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<MemberDashboard />} />
          <Route path="profile" element={<MemberProfile />} />
        </Route>

        {/* Tech Routes */}
        <Route
          path="/client-dashboard"
          element={
            <PrivateRoute requiredRoles={['client']}>
              <ClientLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="profile" element={<ClientProfile />} />
        </Route>

        {/* Fallback Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<ErrorPage type="not-found" />} />
      </Routes>
    </Router>
  );
};