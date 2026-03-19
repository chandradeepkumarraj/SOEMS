import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Activity, Sparkles, Users, Settings } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { onStaffNotificationReceived } from '../../services/socket';
import DashboardShell from './shared/DashboardShell';
import Sidebar from './shared/Sidebar';
import Topbar from './shared/Topbar';

const NOTIFICATION_SOUND = new Audio('/assets/sounds/notify_sound.mp3');
NOTIFICATION_SOUND.volume = 0.6; // High visibility alert volume

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setUser(getCurrentUser());

        // Socket Listener for Staff Notifications
        const cleanup = onStaffNotificationReceived((data) => {
            // Play sound for all alerts/suspensions/security notices
            if (data.type !== 'info') {
                NOTIFICATION_SOUND.play().catch(() => { });
            }
            const newNotification: Notification = {
                id: data.id || Math.random().toString(36).substr(2, 9),
                ...data,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                read: false
            };
            setNotifications(prev => [newNotification, ...prev].slice(0, 20));
        });

        return () => cleanup();
    }, []);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navigation = useMemo(() => [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Shield },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Live Monitor', href: '/admin/monitor', icon: Activity },
        { name: 'AI Configuration', href: '/admin/ai-settings', icon: Sparkles },
        { name: 'Profile & Settings', href: '/admin/profile', icon: Settings },
    ], []);

    // Determine Page Title based on location
    const currentPage = navigation.find(n => location.pathname === n.href);
    const pageTitle = currentPage ? currentPage.name : 'Admin Portal';

    return (
        <DashboardShell
            sidebar={
                <Sidebar
                    roleName="Admin Panel"
                    roleLabel="Super User"
                    roleIcon={Shield}
                    navigation={navigation}
                    user={user}
                    isHovered={isHovered}
                    setIsHovered={setIsHovered}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    handleLogout={handleLogout}
                />
            }
            topbar={
                <Topbar
                    pageTitle={pageTitle}
                    user={user}
                    notifications={notifications}
                    isNotificationOpen={isNotificationOpen}
                    setIsNotificationOpen={setIsNotificationOpen}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    markAllAsRead={markAllAsRead}
                    clearAll={clearAll}
                />
            }
        >
            <Outlet context={{ user }} />
        </DashboardShell>
    );
}
