import { Link, useLocation } from 'react-router-dom';
import { LogOut, Moon, Sun, LucideIcon } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { motion } from 'framer-motion';

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

interface SidebarProps {
    roleName: string;
    roleLabel: string;
    roleIcon: LucideIcon;
    navigation: NavItem[];
    user: any;
    isHovered: boolean;
    setIsHovered: (value: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (value: boolean) => void;
    handleLogout: () => void;
}

export default function Sidebar({
    roleName,
    roleLabel,
    roleIcon: RoleIcon,
    navigation,
    user,
    isHovered,
    setIsHovered,
    isSidebarOpen,
    setIsSidebarOpen,
    handleLogout
}: SidebarProps) {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <motion.aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={false}
            animate={{ width: isHovered ? 256 : 80 }}
            className={`
                fixed md:sticky inset-y-0 left-0 z-30
                bg-[var(--sidebar-bg)] text-white transition-colors duration-300 ease-in-out flex flex-col shadow-2xl overflow-hidden
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                top-0 h-screen
            `}
        >
            {/* Branding */}
            <div className={`p-6 border-b border-[var(--sidebar-border)] flex items-center gap-3 whitespace-nowrap min-h-[81px]`}>
                <RoleIcon className="h-8 w-8 text-primary shrink-0" />
                <span className={`text-xl font-black transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                    {roleName}
                </span>
                {isHovered && (
                    <button
                        onClick={toggleTheme}
                        className="ml-auto p-2 text-gray-400 hover:text-white rounded-full transition-all"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    >
                        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav aria-label={`${roleName} navigation`} className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto thin-scrollbar">
                {navigation.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap relative group
                                ${active
                                    ? 'bg-primary text-white shadow-[var(--glow-primary)] border border-white/10'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }
                            `}
                        >
                            <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-white transition-colors'}`} />
                            <span className={`transition-all duration-500 ease-in-out overflow-hidden ${isHovered || isSidebarOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 md:w-0'}`}>
                                {item.name}
                            </span>
                            {active && !isHovered && (
                                <div className="absolute right-2 h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Summary */}
            <div className="p-4 border-t border-[var(--sidebar-border)] overflow-hidden bg-white/5">
                <div className="flex items-center gap-3 mb-6 px-4 whitespace-nowrap">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHovered || isSidebarOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 md:w-0'}`}>
                        <p className="text-sm font-black truncate text-white">{user?.name || 'User'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{roleLabel}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-black text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-600 hover:text-white hover:border-transparent transition-all duration-300 whitespace-nowrap group shadow-lg shadow-transparent hover:shadow-red-500/20"
                    aria-label="Sign out"
                >
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <LogOut className="h-5 w-5 shrink-0 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <span className={`transition-all duration-500 ease-in-out ${isHovered || isSidebarOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 md:w-0'} tracking-widest uppercase text-[10px]`}>
                        Terminate Session
                    </span>
                </button>
            </div>
        </motion.aside>
    );
}
