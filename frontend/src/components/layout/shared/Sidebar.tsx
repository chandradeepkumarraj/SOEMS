import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Moon, Sun, LucideIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

import { NavItem } from '../../../types/layout';

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

const SidebarNavItem = ({ 
    item, 
    isHovered, 
    isSidebarOpen, 
    onNavigate, 
    level = 0 
}: { 
    item: NavItem; 
    isHovered: boolean; 
    isSidebarOpen: boolean; 
    onNavigate: () => void;
    level?: number;
}) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const active = location.pathname === item.href || (item.children?.some(child => location.pathname === child.href));
    const hasChildren = item.children && item.children.length > 0;

    useEffect(() => {
        if (active && hasChildren) setIsOpen(true);
    }, [active, hasChildren]);

    const handleAction = () => {
        if (hasChildren) {
            setIsOpen(!isOpen);
        } else {
            onNavigate();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAction();
        }
    };

    const content = (
        <div 
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                ${active
                    ? 'bg-primary text-white shadow-[var(--glow-primary)] border border-white/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }
                ${level > 0 ? 'ml-4 py-2 text-xs opacity-90' : ''}
            `}
            onClick={handleAction}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-expanded={hasChildren ? isOpen : undefined}
            aria-haspopup={hasChildren ? 'true' : undefined}
        >
            <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-white transition-colors'}`} />
            
            <span className={`transition-all duration-500 ease-in-out overflow-hidden ${isHovered || isSidebarOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 md:w-0'}`}>
                {item.name}
            </span>

            {(isHovered || isSidebarOpen) && hasChildren && (
                <div className="ml-auto">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
            )}

            {active && !isHovered && !isSidebarOpen && level === 0 && (
                <div className="absolute right-2 h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
            )}
        </div>
    );

    return (
        <div className="space-y-1">
            {hasChildren ? content : <Link to={item.href} tabIndex={-1}>{content}</Link>}
            
            <AnimatePresence>
                {isOpen && hasChildren && (isHovered || isSidebarOpen) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-l border-white/10 ml-6"
                    >
                        {item.children?.map((child, idx) => (
                            <SidebarNavItem 
                                key={idx} 
                                item={child} 
                                isHovered={isHovered} 
                                isSidebarOpen={isSidebarOpen} 
                                onNavigate={onNavigate}
                                level={level + 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={false}
                animate={{ width: (isHovered || isSidebarOpen) ? 280 : 80 }}
                className={`
                    fixed md:sticky inset-y-0 left-0 z-50
                    bg-[var(--sidebar-bg)] text-white transition-colors duration-300 ease-in-out flex flex-col shadow-2xl overflow-hidden
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    top-0 h-screen border-r border-white/5
                `}
            >
                {/* Branding */}
                <div className={`p-6 border-b border-[var(--sidebar-border)] flex items-center gap-3 whitespace-nowrap min-h-[81px]`}>
                    <div className="bg-primary/20 p-2 rounded-xl border border-primary/20 shrink-0">
                        <RoleIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className={`transition-all duration-300 ${isHovered || isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                        <span className="text-lg font-black tracking-tight">{roleName}</span>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Terminal Active</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav aria-label={`${roleName} navigation`} className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto thin-scrollbar">
                    {navigation.map((item, idx) => (
                        <SidebarNavItem 
                            key={idx} 
                            item={item} 
                            isHovered={isHovered} 
                            isSidebarOpen={isSidebarOpen}
                            onNavigate={() => setIsSidebarOpen(false)}
                        />
                    ))}
                </nav>

                {/* Theme & User Profile Widget */}
                <div className="p-4 border-t border-[var(--sidebar-border)] overflow-hidden bg-black/20">
                    <div className="flex items-center justify-between mb-6 px-4">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner border border-white/5">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHovered || isSidebarOpen ? 'w-40 opacity-100' : 'w-0 opacity-0'}`}>
                                <p className="text-sm font-black truncate text-white">{user?.name || 'User Instance'}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{roleLabel}</p>
                            </div>
                        </div>
                        
                        {(isHovered || isSidebarOpen) && (
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
                            >
                                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-xs font-black text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-600 hover:text-white hover:border-transparent transition-all duration-300 whitespace-nowrap group"
                    >
                        <LogOut className="h-5 w-5 shrink-0 group-hover:rotate-12 transition-transform" />
                        <span className={`transition-all duration-500 ${isHovered || isSidebarOpen ? 'opacity-100' : 'opacity-0'} tracking-widest uppercase`}>
                            Disconnect Protocol
                        </span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
