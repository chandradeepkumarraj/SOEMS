import { useState, useEffect } from 'react';
import { Menu, X, Bell, Moon, Sun, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { useTheme } from '../../../context/ThemeContext';
import { getMaintenanceStatus } from '../../../services/authService';

interface Notification {
    id?: string;
    _id?: string;
    type: string;
    title: string;
    message: string;
    timestamp?: Date;
    createdAt?: Date;
    read?: boolean;
    isRead?: boolean;
}

interface TopbarProps {
    pageTitle: string;
    user: any;
    notifications: Notification[];
    isNotificationOpen: boolean;
    setIsNotificationOpen: (value: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (value: boolean) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export default function Topbar({
    pageTitle,
    user,
    notifications,
    isNotificationOpen,
    setIsNotificationOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    markAllAsRead,
    clearAll
}: TopbarProps) {
    const { theme, toggleTheme } = useTheme();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const unreadCount = notifications.filter(n => !(n.read || n.isRead)).length;

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await getMaintenanceStatus();
                setMaintenanceMode(status.maintenanceMode);
            } catch (error) {
                console.error('Failed to fetch maintenance status in Topbar');
            }
        };
        checkStatus();
        
        // Optional: Poll every 60 seconds for real-time admin awareness
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="flex flex-col md:flex-row bg-[var(--card-bg)] border-b border-[var(--border-main)] px-4 md:px-8 h-16 sticky top-0 z-20 transition-colors duration-300 items-center justify-between shadow-sm">
            {/* Left Side: Mobile Menu & Breadcrumb/Title */}
            <div className="flex items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="md:hidden text-[var(--text-main)]"
                    aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                    {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
                <h1 className="text-xl md:text-2xl font-black text-[var(--text-main)] tracking-tight">
                    {pageTitle}
                </h1>

                {/* Maintenance Mode Indicator (Admin Only) */}
                {maintenanceMode && user?.role === 'admin' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full ml-4"
                    >
                        <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Maintenance Protocol Active</span>
                    </motion.div>
                )}
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-[var(--text-muted)] hover:text-primary hover:bg-[var(--bg-main)] rounded-full transition-all"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>

                {/* Notification Center */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setIsNotificationOpen(!isNotificationOpen);
                            if (!isNotificationOpen) markAllAsRead();
                        }}
                        className={`relative p-2 transition-all rounded-full ${isNotificationOpen ? 'bg-primary/10 text-primary' : 'text-[var(--text-muted)] hover:text-primary hover:bg-[var(--bg-main)]'}`}
                        aria-label={`View ${unreadCount} unread notifications`}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-[var(--card-bg)] shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotificationOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-80 bg-[var(--card-bg)] border border-[var(--border-main)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]/50">
                                        <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-main)]">Alert Center</h3>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={clearAll}
                                                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
                                                aria-label="Clear all notifications"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto thin-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center flex flex-col items-center justify-center">
                                                <div className="h-10 w-10 bg-[var(--bg-main)] rounded-full flex items-center justify-center mb-3">
                                                    <Bell className="h-5 w-5 text-[var(--text-muted)] opacity-20" />
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">System Clear</p>
                                            </div>
                                        ) : (
                                            notifications.map((n, i) => {
                                                const id = n.id || n._id || i;
                                                const timestamp = n.timestamp || n.createdAt;
                                                return (
                                                    <div 
                                                        key={id} 
                                                        className={`
                                                            p-4 border-b border-[var(--border-main)] last:border-0 
                                                            hover:bg-primary/5 transition-all duration-300 cursor-pointer
                                                            ${!(n.read || n.isRead) ? 'bg-primary/[0.02] border-l-2 border-l-primary' : ''}
                                                        `}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${n.type === 'suspension' || n.type === 'danger' ? 'text-red-500' : 'text-orange-500'}`}>
                                                                {n.type}
                                                            </span>
                                                            <span className="text-[8px] text-[var(--text-muted)] font-bold tabular-nums">
                                                                {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-[var(--text-main)] mb-1 truncate pr-2">{n.title}</h4>
                                                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed italic line-clamp-2">"{n.message}"</p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile Widget */}
                <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-[var(--border-main)] ml-2" aria-label="User profile summary">
                    <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-black text-[var(--text-main)] leading-none mb-1">{user?.name || 'Guest User'}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                            {user?.rollNo ? `ROLL: ${user.rollNo}` : user?.email || 'OFFLINE'}
                        </p>
                    </div>
                    
                    <Link to={
                        user?.role === 'admin' ? '/admin/profile' :
                        user?.role === 'teacher' ? '/teacher/profile' :
                        user?.role === 'proctor' ? '/proctor/profile' : '/profile'
                    }>
                        <motion.div 
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-[var(--card-bg)] shadow-sm cursor-pointer overflow-hidden group transition-all duration-300 hover:ring-2 hover:ring-primary/50"
                        >
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="User" className="h-full w-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <User className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-500" />
                            )}
                        </motion.div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
