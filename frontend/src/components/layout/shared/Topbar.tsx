import { useState, useEffect } from 'react';
import { Menu, X, Bell, Moon, Sun, User, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
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
        getMaintenanceStatus().then(status => setMaintenanceMode(status.maintenanceMode)).catch(() => {});
    }, []);

    const getNotificationColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'danger':
            case 'critical':
            case 'suspension':
                return 'border-red-500/20 bg-red-500/5 text-red-500';
            case 'warning':
            case 'alert':
                return 'border-amber-500/20 bg-amber-500/5 text-amber-500';
            default:
                return 'border-[var(--border-main)] hover:bg-primary/5';
        }
    };

    return (
        <header className="flex bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--border-main)] px-4 md:px-8 h-16 md:h-20 sticky top-0 z-40 transition-all duration-300 items-center justify-between shadow-sm">
            {/* Left Section: Context & Controls */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="md:hidden p-2 text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-xl transition-all"
                    aria-label="Toggle Navigation"
                >
                    {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <div className="flex flex-col">
                    <h1 className="text-xl md:text-2xl font-black text-[var(--text-main)] tracking-tight leading-none">
                        {pageTitle}
                    </h1>
                </div>

                {maintenanceMode && user?.role === 'admin' && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full ml-4">
                        <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Safe Mode Active</span>
                    </div>
                )}
            </div>

            {/* Right Section: Intelligence & Presence */}
            <div className="flex items-center gap-3">
                {/* Search - Decorative for UI quality */}
                <div 
                    className="hidden xl:flex items-center px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl group hover:border-primary/50 transition-all gap-3 w-64 mr-2 cursor-help"
                    title="Global Instance Search - Coming in Version 3.1"
                >
                    <Search className="h-4 w-4 text-[var(--text-muted)] group-hover:text-primary transition-colors" />
                    <span className="text-xs text-[var(--text-muted)] font-bold">Search Instance...</span>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 text-[var(--text-muted)] hover:text-primary hover:bg-[var(--bg-main)] rounded-xl transition-all border border-transparent hover:border-[var(--border-main)]"
                    title={theme === 'light' ? 'Override to Dark' : 'Restore Light'}
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>

                {/* Notification Hub */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setIsNotificationOpen(!isNotificationOpen);
                            if (!isNotificationOpen) markAllAsRead();
                        }}
                        className={`
                            relative p-2.5 transition-all rounded-xl border
                            ${isNotificationOpen 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'text-[var(--text-muted)] border-transparent hover:border-[var(--border-main)] hover:bg-[var(--bg-main)]'
                            }
                        `}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-[var(--card-bg)]" />
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotificationOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.9, rotate: -2 }}
                                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.9, rotate: -2 }}
                                    className="absolute right-0 mt-3 w-80 bg-[var(--card-bg)] border border-[var(--border-main)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]/50 backdrop-blur-md">
                                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-main)]">Alert Matrix</h3>
                                        <button onClick={clearAll} className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest">Purge All</button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto thin-scrollbar p-2 space-y-1">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center opacity-40 italic text-xs">No pending disruptions detected.</div>
                                        ) : (
                                            notifications.map((n, i) => (
                                                <div 
                                                    key={n.id || n._id || i} 
                                                    className={`p-3 border rounded-xl transition-all cursor-pointer ${getNotificationColor(n.type)}`}
                                                >
                                                    <h4 className="text-[11px] font-black mb-1 uppercase tracking-tight">{n.title}</h4>
                                                    <p className="text-[10px] line-clamp-2 leading-relaxed opacity-80 font-medium">{n.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Identity Profile */}
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-[var(--border-main)] ml-2">
                    <div className="text-right flex flex-col items-end">
                        <p className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight leading-none mb-1">{user?.name?.split(' ')[0] || 'User'}</p>
                        <p className="text-[9px] font-bold text-primary uppercase tracking-[0.1em]">{user?.role || 'Guest'}</p>
                    </div>
                    
                    <Link to={user?.role === 'admin' ? '/admin/profile' : user?.role === 'teacher' ? '/teacher/profile' : '/profile'}>
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-[var(--card-bg)] shadow-md cursor-pointer overflow-hidden transform active:scale-95 transition-all">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="V" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-primary" />
                            )}
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
