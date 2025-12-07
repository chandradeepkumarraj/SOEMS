import { useState, useEffect } from 'react';
import { Users, Shield, Activity, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import UserManagement from '../components/admin/UserManagement';
import SystemHealth from '../components/admin/SystemHealth';
import { getUsers } from '../services/adminService';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');
    const [stats, setStats] = useState([
        { label: 'Total Users', value: '...', icon: Users, color: 'bg-blue-500' },
        { label: 'Active Exams', value: '...', icon: Activity, color: 'bg-emerald-500' },
        { label: 'Security Alerts', value: '0', icon: AlertTriangle, color: 'bg-orange-500' },
    ]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const usersData = await getUsers();
            setStats([
                { label: 'Total Users', value: usersData.length.toString(), icon: Users, color: 'bg-blue-500' },
                { label: 'System Active', value: 'Online', icon: Activity, color: 'bg-emerald-500' },
                { label: 'Security Alerts', value: '0', icon: AlertTriangle, color: 'bg-orange-500' },
            ]);
        } catch (error) {
            console.error('Failed to fetch admin stats');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        <span className="font-bold text-xl">Admin Panel</span>
                    </div>
                </div>
                <nav className="p-4 space-y-1 flex-1">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Users className="h-5 w-5" />
                        User Management
                    </button>
                    <Link
                        to="/admin/monitor"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <Activity className="h-5 w-5" />
                        Live Monitor
                    </Link>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'system' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <div className="h-5 w-5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        System Health
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-700" />
                        <div>
                            <p className="text-sm font-medium"><Link to="/profile" className="hover:underline">Administrator</Link></p>
                            <p className="text-xs text-gray-400">Super User</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {activeTab === 'users' ? 'User Management' : 'System Status'}
                        </h1>
                        <p className="text-gray-500">Overview of system performance and users.</p>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 font-medium">{stat.label}</h3>
                                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 text-${stat.color.replace('bg-', '')}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Content Area */}
                {activeTab === 'users' ? <UserManagement /> : <SystemHealth />}
            </main>
        </div>
    );
}
