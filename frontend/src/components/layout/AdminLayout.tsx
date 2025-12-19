import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Activity, LogOut, Menu, X, Settings, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getCurrentUser } from '../../services/authService';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
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
        { name: 'Dashboard', href: '/admin/dashboard', icon: Shield },
        { name: 'User Management', href: '/admin/users', icon: Users }, // New Route
        { name: 'Live Monitor', href: '/admin/monitor', icon: Activity },
        { name: 'Profile & Settings', href: '/admin/profile', icon: Settings },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white hover:bg-gray-800">
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                    <span className="text-xl font-bold">Admin Portal</span>
                </div>
                <div className="flex items-center gap-2">
                    {user?.name && (
                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                            {user.name.charAt(0)}
                        </div>
                    )}
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-30 w-64 bg-gray-900 text-white transition-transform duration-200 ease-in-out flex flex-col shadow-xl`}>
                <div className="p-6 border-b border-gray-800 hidden md:flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 mt-4">
                    {navigation.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${active
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-500'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-6 px-4">
                        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-primary font-bold">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.name || 'Administrator'}</p>
                            <p className="text-xs text-gray-500 truncate">Super User</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 w-full overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
}
