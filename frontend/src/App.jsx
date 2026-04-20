import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';
import Layout from './components/layout/Layout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import Dashboard from './pages/manager/Dashboard';
import Analytics from './pages/manager/Analytics';
import Reports from './pages/manager/Reports';

import Production from './pages/supervisor/Production';
import Pens from './pages/supervisor/Pens';
import Notifications from './pages/supervisor/Notifications';

import Eggs from './pages/inventory/Eggs';
import Feed from './pages/inventory/Feed';
import Trays from './pages/inventory/Trays';

import Alerts from './pages/shared/Alerts';
import Profile from './pages/shared/Profile';
import Settings from './pages/shared/Settings';

import Users from './pages/admin/Users';
import Payments from './pages/admin/Payments';
import CustomerDashboard from './pages/customer/CustomerDashboard';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="production" element={<Production />} />
          <Route path="pens" element={<Pens />} />

          <Route path="inventory/eggs" element={<Eggs />} />
          <Route path="inventory/feed" element={<Feed />} />
          <Route path="inventory/trays" element={<Trays />} />

          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="customer" element={<CustomerDashboard />} />

          <Route element={<RoleRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="users" element={<Users />} />
            <Route path="payments" element={<Payments />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;