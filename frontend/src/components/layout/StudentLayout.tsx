import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, User, LogOut, Menu, X, Bell, Moon, Sun } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile } from '../../services/userService';

export default function StudentLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const { theme, toggleTheme } = useTheme();
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
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Exams', href: '/student/exams', icon: FileText },
        { name: 'My Results', href: '/student/results', icon: BookOpen },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col md:flex-row theme-transition">
            {/* Mobile Header */}
            <header className="md:hidden bg-[var(--card-bg)] border-b border-[var(--border-main)] p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                    <span className="text-xl font-bold text-primary">SOEMS</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-full transition-colors"
                    >
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </button>
                    <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
                    </button>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-30 ${isHovered ? 'md:w-64' : 'md:w-20'} bg-[var(--card-bg)] border-r border-[var(--border-main)] transition-all duration-300 ease-in-out flex flex-col overflow-hidden shadow-sm shadow-slate-200/50 dark:shadow-none`}
            >
                <div className="p-6 border-b border-[var(--border-main)] hidden md:flex items-center gap-3 whitespace-nowrap transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-primary/20">S</div>
                    <span className={`text-xl font-bold text-[var(--text-main)] transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>Student Portal</span>
                </div>

                {/* User Profile Summary in Sidebar (Desktop) */}
                <div className="p-6 border-b border-[var(--border-main)] hidden md:block overflow-hidden transition-colors">
                    <div className="flex items-center gap-3 whitespace-nowrap mb-0.5">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-[var(--card-bg)] shadow-sm shrink-0 transition-colors">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            <p className="font-bold text-[var(--text-main)] truncate">{user?.name || 'Loading...'}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                                <span className={`transition-opacity duration-300 ${isHovered || isSidebarOpen ? 'opacity-100' : 'md:opacity-0'}`}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 overflow-hidden">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span className={`transition-opacity duration-300 ${isHovered || isSidebarOpen ? 'opacity-100' : 'md:opacity-0'}`}>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 h-[calc(100vh-64px)] md:h-screen w-full overflow-x-hidden overflow-y-auto bg-transparent">
                {/* Desktop Header */}
                <header className="hidden md:flex bg-[var(--card-bg)] border-b border-[var(--border-main)] px-8 py-4 sticky top-0 z-10 justify-between items-center transition-colors duration-300">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-main)]">
                            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-full transition-all"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </button>
                        <button className="relative p-2 text-slate-400 hover:text-primary hover:bg-[var(--bg-main)] rounded-full transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-[var(--card-bg)]"></span>
                        </button>
                        <div className="h-8 w-px bg-[var(--border-main)] mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-[var(--text-main)]">{user?.name}</p>
                                <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-tighter">Roll No: {user?.rollNo}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
}
