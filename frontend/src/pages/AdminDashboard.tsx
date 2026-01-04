import { useState, useEffect } from 'react';
import { Users, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import SystemHealth from '../components/admin/SystemHealth';
import { getUsers } from '../services/adminService';

export default function AdminDashboard() {
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
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-500">Overview of system health and key metrics.</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
                <h2 className="text-lg font-bold mb-4">System Status</h2>
                <SystemHealth />
            </div>
        </div>
    );
}
