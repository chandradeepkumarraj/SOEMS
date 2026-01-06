import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const user = getCurrentUser();

    if (!user) {
        // Not logged in, redirect to login
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Logged in but not authorized
        // Redirect based on role to their respective dashboard
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'proctor') return <Navigate to="/proctor/dashboard" replace />;
        if (user.role === 'student') return <Navigate to="/dashboard" replace />;

        // Fallback
        return <Navigate to="/" replace />;
    }

    // Authorized
    return <Outlet />;
};

export default ProtectedRoute;
