import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Users, Menu, X, LogOut, User, Moon, Sun } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile } from '../../services/userService';

export default function TeacherLayout() {
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
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, []);

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col md:flex-row theme-transition">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-[var(--card-bg)] border-b border-[var(--border-main)] z-30 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                        T
                    </div>
                    <span className="font-bold text-xl text-[var(--text-main)]">Teacher Portal</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-full transition-colors"
                    >
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-[var(--text-main)]">
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                fixed md:sticky inset-y-0 left-0 z-30 ${isHovered ? 'md:w-64' : 'md:w-20'} bg-[var(--card-bg)] border-r border-[var(--border-main)] flex flex-col transition-all duration-300 ease-in-out overflow-hidden
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                top-16 md:top-0 h-[calc(100vh-64px)] md:h-screen shadow-sm
            `}>
                <div className="p-6 border-b border-[var(--border-main)] hidden md:flex items-center gap-3 whitespace-nowrap">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shrink-0">
                        T
                    </div>
                    <span className={`font-bold text-xl text-[var(--text-main)] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>Teacher Portal</span>
                    {isHovered && (
                        <button
                            onClick={toggleTheme}
                            className="ml-auto p-2 text-[var(--text-main)] hover:bg-[var(--bg-main)] rounded-full transition-all"
                            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        >
                            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </button>
                    )}
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <Link
                        to="/teacher/dashboard"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${isActive('/teacher/dashboard')
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <BarChart3 className="h-5 w-5 shrink-0" />
                        <span className={`transition-all duration-300 ${isHovered || isSidebarOpen ? 'opacity-100 translate-x-0' : 'md:opacity-0 -translate-x-2'}`}>Dashboard</span>
                    </Link>
                    <Link
                        to="/teacher/exams"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${isActive('/teacher/exams')
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <FileText className="h-5 w-5 shrink-0" />
                        <span className={`transition-all duration-300 ${isHovered || isSidebarOpen ? 'opacity-100 translate-x-0' : 'md:opacity-0 -translate-x-2'}`}>My Exams</span>
                    </Link>
                    <Link
                        to="/teacher/students"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${isActive('/teacher/students')
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Users className="h-5 w-5 shrink-0" />
                        <span className={`transition-all duration-300 ${isHovered || isSidebarOpen ? 'opacity-100 translate-x-0' : 'md:opacity-0 -translate-x-2'}`}>Students</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-[var(--border-main)] overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 whitespace-nowrap">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                            {user?.name?.charAt(0) || <User className="h-5 w-5" />}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isHovered || isSidebarOpen ? 'opacity-100 translate-x-0' : 'md:opacity-0 -translate-x-4'}`}>
                            <p className="text-sm font-bold text-[var(--text-main)] truncate">{user?.name || 'Loading...'}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4 shrink-0" />
                        <span className={`transition-opacity duration-300 ${isHovered || isSidebarOpen ? 'opacity-100' : 'md:opacity-0'}`}>Sign Out</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mt-16 md:mt-0 w-full overflow-x-hidden p-8">
                <Outlet context={{ user }} />
            </main>
        </div>
    );
}
