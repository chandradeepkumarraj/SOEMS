import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Users, Shield, Activity, Search, MoreVertical, UserPlus, AlertTriangle, CheckCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');

    const stats = [
        { label: 'Total Users', value: '2,543', icon: Users, color: 'bg-blue-500' },
        { label: 'Active Exams', value: '8', icon: Activity, color: 'bg-emerald-500' },
        { label: 'Security Alerts', value: '3', icon: AlertTriangle, color: 'bg-orange-500' },
    ];

    const users = [
        { id: 1, name: 'Alice Johnson', role: 'Student', email: 'alice@soems.edu', status: 'Active' },
        { id: 2, name: 'Prof. Anderson', role: 'Teacher', email: 'anderson@soems.edu', status: 'Active' },
        { id: 3, name: 'System Admin', role: 'Admin', email: 'admin@soems.edu', status: 'Active' },
        { id: 4, name: 'John Doe', role: 'Student', email: 'john@soems.edu', status: 'Suspended' },
    ];

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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <Users className="h-5 w-5" />
                        User Management
                    </button>
                    <Link to="/admin/monitor" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                        <Activity className="h-5 w-5" />
                        Live Monitor
                    </Link>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'system' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <SettingsIcon className="h-5 w-5" />
                        System Health
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-700" />
                        <div>
                            <p className="text-sm font-medium">Administrator</p>
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
                    <Button className="gap-2">
                        <UserPlus className="h-5 w-5" /> Add New User
                    </Button>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">All Users</h2>
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'Teacher' ? 'bg-emerald-100 text-emerald-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                {user.status === 'Active' ? (
                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-error" />
                                                )}
                                                <span className={user.status === 'Active' ? 'text-gray-900' : 'text-error'}>
                                                    {user.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SettingsIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
