import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Users, Menu, X, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getUserProfile } from '../../services/userService';

export default function TeacherLayout() {
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
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-30 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                        T
                    </div>
                    <span className="font-bold text-xl text-gray-900">Teacher Portal</span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
                    {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                top-16 md:top-0 h-[calc(100vh-64px)] md:h-screen
            `}>
                <div className="p-6 border-b border-gray-100 hidden md:flex">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                            T
                        </div>
                        <span className="font-bold text-xl text-gray-900">Teacher Portal</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <Link
                        to="/teacher/dashboard"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/teacher/dashboard') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <BarChart3 className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link
                        to="/teacher/exams"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/teacher/exams') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <FileText className="h-5 w-5" />
                        My Exams
                    </Link>
                    <Link
                        to="/teacher/students"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/teacher/students') ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Users className="h-5 w-5" />
                        Students
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover bg-gray-200"
                        />
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Loading...'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
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
