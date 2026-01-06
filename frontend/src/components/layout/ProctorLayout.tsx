import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Menu, X, Settings, Shield, Moon, Sun } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { getCurrentUser } from '../../services/authService';

export default function ProctorLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/proctor/dashboard', icon: Shield },
        { name: 'Profile', href: '/proctor/profile', icon: Settings },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col md:flex-row transition-colors duration-300">
            {/* Mobile Header */}
            <header className="md:hidden bg-blue-900 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white hover:bg-blue-800 transition-colors">
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                    <span className="text-xl font-bold">Proctor Portal</span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 text-white hover:bg-blue-800 rounded-full transition-colors"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
            </header>

            {/* Sidebar */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-30 ${isHovered ? 'md:w-64' : 'md:w-20'} bg-blue-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl overflow-hidden`}
            >
                <div className="p-6 border-b border-blue-800 hidden md:flex items-center gap-3 whitespace-nowrap">
                    <Activity className="h-8 w-8 text-primary shrink-0" />
                    <span className={`text-xl font-bold transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>Proctor Panel</span>
                    {isHovered && (
                        <button
                            onClick={toggleTheme}
                            className="ml-auto p-2 text-blue-100 hover:bg-blue-800 rounded-full transition-all"
                            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        >
                            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </button>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1 mt-4">
                    {navigation.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${active
                                    ? 'bg-blue-700 text-white shadow-lg border-l-4 border-primary'
                                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-blue-300'}`} />
                                <span className={`transition-opacity duration-300 ${isHovered || isSidebarOpen ? 'opacity-100' : 'md:opacity-0'}`}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-blue-800 overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 px-4 whitespace-nowrap">
                        <div className="h-10 w-10 rounded-full bg-blue-800 flex items-center justify-center text-primary font-bold shrink-0">
                            {user?.name?.charAt(0) || 'P'}
                        </div>
                        <div className={`overflow-hidden transition-opacity duration-300 ${isHovered || isSidebarOpen ? 'opacity-100' : 'md:opacity-0'}`}>
                            <p className="text-sm font-medium truncate">{user?.name || 'Proctor'}</p>
                            <p className="text-xs text-blue-300 truncate">Official Proctor</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-blue-100 hover:bg-red-500/10 hover:text-red-500 transition-colors whitespace-nowrap"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span className={`transition-opacity duration-300 ${isHovered || isSidebarOpen ? 'opacity-100' : 'md:opacity-0'}`}>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 w-full overflow-x-hidden overflow-y-auto bg-transparent p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
}
