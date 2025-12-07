import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, User, LogOut, Menu, X, Bell, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getUserProfile } from '../../services/userService';

export default function StudentLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
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
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                    <span className="text-xl font-bold text-primary">SOEMS</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
                    </button>
                    {user?.avatarUrl && (
                        <img src={user.avatarUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                    )}
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out flex flex-col`}>
                <div className="p-6 border-b border-gray-200 hidden md:flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">S</div>
                    <span className="text-xl font-bold text-gray-900">Student Portal</span>
                </div>

                {/* User Profile Summary in Sidebar (Desktop) */}
                <div className="p-6 border-b border-gray-200 hidden md:block">
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                            alt={user?.name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="overflow-hidden">
                            <p className="font-medium text-gray-900 truncate">{user?.name || 'Loading...'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary/5 text-primary'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
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
            <main className="flex-1 h-[calc(100vh-64px)] md:h-screen w-full overflow-x-hidden overflow-y-auto bg-gray-50">
                {/* Desktop Header */}
                <header className="hidden md:flex bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">Student ID: #{user?._id?.slice(-4)}</p>
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
