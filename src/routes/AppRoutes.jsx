import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PrivateRoute } from '../auth/PrivateRoute';
const Login = React.lazy(() => import('../pages/login/Login').then(m => ({ default: m.Login })));
const ErrorPage = React.lazy(() => import('../pages/error/ErrorPage').then(m => ({ default: m.ErrorPage })));
const SuperAdminLayout = React.lazy(() => import('../pages/superadmin/components/SuperAdminLayout').then(m => ({ default: m.SuperAdminLayout })));
const SuperAdminDashboard = React.lazy(() => import('../pages/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const SuperAdminProfile = React.lazy(() => import('../pages/superadmin/Profile').then(m => ({ default: m.SuperAdminProfile })));
const UserManagement = React.lazy(() => import('../pages/superadmin/UserManagement').then(m => ({ default: m.UserManagement })));
const PhoneNumbers = React.lazy(() => import('../pages/superadmin/PhoneNumbers'));
const IndianNumbers = React.lazy(() => import('../pages/superadmin/IndianNumbers'));
const PasswordFormatters = React.lazy(() => import('../pages/superadmin/PasswordFormatters'));
const ValidPhoneNumber = React.lazy(() => import('../pages/superadmin/ValidPhoneNumber'));
const IndianValidPhoneNumber = React.lazy(() => import('../pages/superadmin/IndianValidPhoneNumber'));
const MachineManagement = React.lazy(() => import('../pages/superadmin/MachineManagement'));





export const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <React.Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
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
            <Route path="phone-numbers" element={<PhoneNumbers />} />
            <Route path="indian-numbers" element={<IndianNumbers />} />
            <Route path="password-formatters" element={<PasswordFormatters />} />
            <Route path="valid-phone-password" element={<ValidPhoneNumber />} />
            <Route path="indian-valid-phone-password" element={<IndianValidPhoneNumber />} />
            <Route path="machine-management" element={<MachineManagement />} />
            <Route path="profile" element={<SuperAdminProfile />} />
          </Route>
          {/* Fallback Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<ErrorPage type="not-found" />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
};