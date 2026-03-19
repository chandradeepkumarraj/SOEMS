import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Users, GraduationCap, User } from 'lucide-react';
import { getUserProfile } from '../../services/userService';
import { onStaffNotificationReceived } from '../../services/socket';
import DashboardShell from './shared/DashboardShell';
import Sidebar from './shared/Sidebar';
import Topbar from './shared/Topbar';

const NOTIFICATION_SOUND = new Audio('/assets/sounds/notify_sound.mp3');
NOTIFICATION_SOUND.volume = 0.6;

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

export default function TeacherLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await getUserProfile();
                setUser(data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();

        // Socket Listener for Staff Notifications
        const cleanup = onStaffNotificationReceived((data) => {
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
        { name: 'Dashboard', href: '/teacher/dashboard', icon: BarChart3 },
        { name: 'My Exams', href: '/teacher/exams', icon: FileText },
        { name: 'Students', href: '/teacher/students', icon: Users },
        { name: 'Profile', href: '/teacher/profile', icon: User },
    ], []);

    // Determine Page Title
    const currentPage = navigation.find(n => location.pathname === n.href);
    const pageTitle = currentPage ? currentPage.name : 'Teacher Portal';

    return (
        <DashboardShell
            sidebar={
                <Sidebar
                    roleName="Teacher Portal"
                    roleLabel="Academic Staff"
                    roleIcon={GraduationCap}
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
