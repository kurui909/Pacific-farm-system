import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function RoleRoute({ allowedRoles }) { const { user } = useAuth(); return user && allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/dashboard" replace />; }