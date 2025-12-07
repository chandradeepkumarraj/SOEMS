import React from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, AlertTriangle, Wifi, WifiOff, Eye, Mic, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LiveMonitor() {
    const students = [
        { id: 1, name: 'Alice Johnson', status: 'Normal', connection: 'Good', lastActivity: 'Just now' },
        { id: 2, name: 'Bob Smith', status: 'Suspicious', connection: 'Unstable', lastActivity: '1m ago' },
        { id: 3, name: 'Charlie Brown', status: 'Normal', connection: 'Good', lastActivity: 'Just now' },
        { id: 4, name: 'Diana Prince', status: 'Disconnected', connection: 'Lost', lastActivity: '5m ago' },
        { id: 5, name: 'Evan Wright', status: 'Normal', connection: 'Good', lastActivity: 'Just now' },
        { id: 6, name: 'Fiona Gallagher', status: 'Normal', connection: 'Good', lastActivity: 'Just now' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard">
                        <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800 gap-2">
                            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-gray-700" />
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        Live Proctoring Session
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Active Students:</span>
                        <span className="font-bold text-white">42</span>
                    </div>
                    <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>3 Alerts</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {students.map((student) => (
                    <Link to={`/admin/monitor/${student.id}`} key={student.id}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`relative aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:ring-2 hover:ring-primary ${student.status === 'Suspicious' ? 'border-red-500' :
                                student.status === 'Disconnected' ? 'border-gray-600' :
                                    'border-transparent'
                                }`}
                        >
                            {/* Mock Video Feed Placeholder */}
                            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                                {student.status === 'Disconnected' ? (
                                    <div className="flex flex-col items-center text-gray-500">
                                        <WifiOff className="h-8 w-8 mb-2" />
                                        <span className="text-sm">Signal Lost</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-600">
                                        <Eye className="h-8 w-8 opacity-20" />
                                    </div>
                                )}
                            </div>

                            {/* Overlays */}
                            <div className="absolute inset-0 p-3 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/60">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium truncate max-w-[120px]">{student.name}</span>
                                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${student.status === 'Suspicious' ? 'bg-red-500 text-white' :
                                        student.status === 'Disconnected' ? 'bg-gray-600 text-gray-300' :
                                            'bg-green-500 text-white'
                                        }`}>
                                        {student.status}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="flex gap-2">
                                        <div className="p-1.5 bg-black/40 rounded hover:bg-white/20 cursor-pointer transition-colors">
                                            <Mic className="h-3 w-3" />
                                        </div>
                                        <div className="p-1.5 bg-black/40 rounded hover:bg-white/20 cursor-pointer transition-colors">
                                            <Maximize2 className="h-3 w-3" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                        <Wifi className="h-3 w-3" />
                                        {student.connection}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
