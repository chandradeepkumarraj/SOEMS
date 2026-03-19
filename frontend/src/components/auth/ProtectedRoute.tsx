import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser, getMaintenanceStatus } from '../../services/authService';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const user = getCurrentUser();
    const [maintenance, setMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSystemStatus = async () => {
            // Admins bypass maintenance mode checks entirely
            if (user?.role === 'admin') {
                setLoading(false);
                return;
            }

            try {
                const data = await getMaintenanceStatus();
                setMaintenance(data.maintenanceMode);
            } catch (error) {
                console.error('Failed to fetch maintenance status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSystemStatus();
    }, [user?.role]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (maintenance && user?.role !== 'admin') {
        return <Navigate to="/maintenance" replace />;
    }

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
