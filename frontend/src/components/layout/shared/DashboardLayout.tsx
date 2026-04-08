import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import { onNotificationReceived, onStaffNotificationReceived } from '../../../services/socket';
import { getMyNotifications, markAllAsRead as apiMarkAllAsRead, clearNotifications as apiClearNotifications } from '../../../services/notificationService';
import DashboardShell from './DashboardShell';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const NOTIFICATION_SOUND = new Audio('/assets/sounds/notify_sound.mp3');
NOTIFICATION_SOUND.volume = 0.6;

import { NavItem, Notification } from '../../../types/layout';

interface DashboardLayoutProps {
    roleName: string;
    roleLabel: string;
    roleIcon: LucideIcon;
    navigation: NavItem[];
    isStaff?: boolean;
}

export default function DashboardLayout({
    roleName,
    roleLabel,
    roleIcon,
    navigation,
    isStaff = false
}: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        // Initial fetch for notifications (Student) or empty (Staff)
        const fetchInitialNotifications = async () => {
            if (!isStaff) {
                try {
                    const data = await getMyNotifications();
                    setNotifications(data.notifications);
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                }
            }
        };
        fetchInitialNotifications();

        // Socket Listener
        const socketCleanup = isStaff 
            ? onStaffNotificationReceived((data) => {
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
            })
            : onNotificationReceived((data) => {
                NOTIFICATION_SOUND.play().catch(() => { });
                const newNotification: Notification = {
                    _id: data._id || Math.random().toString(36).substr(2, 9),
                    ...data,
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    isRead: false
                };
                setNotifications(prev => [newNotification, ...prev].slice(0, 50));
            });

        return () => socketCleanup();
    }, [isStaff]);

    const markAllAsRead = async () => {
        if (!isStaff) {
            try {
                await apiMarkAllAsRead();
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (error) {
                console.error('Failed to mark notifications read', error);
            }
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const clearAll = async () => {
        if (!isStaff) {
            try {
                await apiClearNotifications();
                setNotifications([]);
            } catch (error) {
                console.error('Failed to clear notifications', error);
            }
        } else {
            setNotifications([]);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Determine Page Title
    const findCurrentPage = (items: NavItem[]): NavItem | undefined => {
        for (const item of items) {
            if (item.href === location.pathname) return item;
            if (item.children) {
                const child = findCurrentPage(item.children);
                if (child) return child;
            }
        }
    };
    const currentPage = findCurrentPage(navigation);
    const pageTitle = currentPage ? currentPage.name : roleName;

    return (
        <DashboardShell
            sidebar={
                <Sidebar
                    roleName={roleName}
                    roleLabel={roleLabel}
                    roleIcon={roleIcon}
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
