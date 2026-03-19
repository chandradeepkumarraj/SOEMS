import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, User } from 'lucide-react';
import { getUserProfile } from '../../services/userService';
import { onNotificationReceived } from '../../services/socket';
import { getMyNotifications, markAllAsRead as apiMarkAllAsRead, clearNotifications as apiClearNotifications } from '../../services/notificationService';
import DashboardShell from './shared/DashboardShell';
import Sidebar from './shared/Sidebar';
import Topbar from './shared/Topbar';

const NOTIFICATION_SOUND = new Audio('/assets/sounds/notify_sound.mp3');
NOTIFICATION_SOUND.volume = 0.6;

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date;
    isRead: boolean;
}

export default function StudentLayout() {
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
                console.error('Failed to fetch user profile:', error);
            }
        };
        const fetchNotifications = async () => {
            try {
                const data = await getMyNotifications();
                setNotifications(data.notifications);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchUser();
        fetchNotifications();

        // Socket Listener for Notifications
        const cleanup = onNotificationReceived((data) => {
            NOTIFICATION_SOUND.play().catch(() => { });
            const newNotification: Notification = {
                _id: data._id || Math.random().toString(36).substr(2, 9),
                ...data,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                isRead: false
            };
            setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        });

        return () => cleanup();
    }, []);

    const markAllAsRead = async () => {
        try {
            await apiMarkAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark notifications read', error);
        }
    };

    const clearAll = async () => {
        try {
            await apiClearNotifications();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navigation = useMemo(() => [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Exams', href: '/student/exams', icon: FileText },
        { name: 'My Results', href: '/student/results', icon: BookOpen },
        { name: 'Profile', href: '/profile', icon: User },
    ], []);

    // Determine Page Title
    const currentPage = navigation.find(n => location.pathname === n.href);
    const pageTitle = currentPage ? currentPage.name : 'Student Portal';

    return (
        <DashboardShell
            sidebar={
                <Sidebar
                    roleName="Student Portal"
                    roleLabel="Undergraduate"
                    roleIcon={LayoutDashboard}
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
