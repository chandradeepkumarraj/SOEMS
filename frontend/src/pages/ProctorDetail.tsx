import React from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Mic, Video, Monitor, AlertTriangle, Shield, MessageSquare, Ban, Flag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProctorDetail() {
    const { studentId } = useParams();

    // Mock Data
    const student = {
        name: 'Rajesh Kumar',
        id: 'ST-2025-042',
        exam: 'Physics - Mechanics',
        status: 'Suspicious',
        confidence: 89,
        device: { webcam: true, mic: true, screen: true }
    };

    const events = [
        { id: 1, time: '15:42', type: 'High Alert', message: 'Gaze anomaly detected (>5s)', confidence: '89%' },
        { id: 2, time: '15:40', type: 'Info', message: 'Tab switch detected (minimized window)', confidence: '100%' },
        { id: 3, time: '15:00', type: 'Success', message: 'Face verification successful', confidence: '97%' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/admin/monitor">
                        <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700 gap-2">
                            <ArrowLeft className="h-5 w-5" /> Back to Grid
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-gray-700" />
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            {student.name}
                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                                {student.status}
                            </span>
                        </h1>
                        <p className="text-xs text-gray-400">ID: {student.id} • {student.exam}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium">Live Feed</span>
                    </div>
                    <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10 gap-2">
                        <Ban className="h-4 w-4" /> Terminate Exam
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Video Feed */}
                <div className="flex-1 bg-black relative flex flex-col">
                    <div className="flex-1 relative">
                        {/* Mock Video Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center">
                                <div className="h-24 w-24 rounded-full bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                                    <Video className="h-10 w-10 text-gray-600" />
                                </div>
                                <p className="text-gray-500">Live Video Stream</p>
                            </div>
                        </div>

                        {/* Overlays */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs font-medium flex items-center gap-2">
                                <Video className="h-3 w-3 text-green-400" /> Webcam
                            </div>
                            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs font-medium flex items-center gap-2">
                                <Mic className="h-3 w-3 text-green-400" /> Mic
                            </div>
                            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs font-medium flex items-center gap-2">
                                <Monitor className="h-3 w-3 text-green-400" /> Screen
                            </div>
                        </div>

                        <div className="absolute top-4 right-4">
                            <div className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold shadow-lg animate-pulse">
                                Suspicious Activity Detected
                            </div>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-4 px-6 shrink-0">
                        <Button variant="secondary" className="gap-2 bg-gray-700 hover:bg-gray-600 text-white border-none">
                            <MessageSquare className="h-4 w-4" /> Message Student
                        </Button>
                        <Button variant="secondary" className="gap-2 bg-gray-700 hover:bg-gray-600 text-white border-none">
                            <Shield className="h-4 w-4" /> Verify ID
                        </Button>
                        <Button variant="secondary" className="gap-2 bg-gray-700 hover:bg-gray-600 text-white border-none">
                            <Flag className="h-4 w-4" /> Flag Incident
                        </Button>
                    </div>
                </div>

                {/* Right Panel: Info & Logs */}
                <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
                    {/* Exam Progress */}
                    <div className="p-6 border-b border-gray-700">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Exam Progress</h3>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-300">Question 10 of 50</span>
                                <span className="text-gray-400">20%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-1/5" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-700/50 p-3 rounded-lg">
                                <p className="text-gray-500 text-xs mb-1">Time Elapsed</p>
                                <p className="font-mono font-medium">00:35:12</p>
                            </div>
                            <div className="bg-gray-700/50 p-3 rounded-lg">
                                <p className="text-gray-500 text-xs mb-1">Last Activity</p>
                                <p className="font-mono font-medium">5s ago</p>
                            </div>
                        </div>
                    </div>

                    {/* Event Log */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Proctoring Log</h3>
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div key={event.id} className="relative pl-4 border-l-2 border-gray-700 pb-4 last:pb-0">
                                    <div className={`absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full ${event.type === 'High Alert' ? 'bg-red-500' :
                                            event.type === 'Info' ? 'bg-blue-500' : 'bg-green-500'
                                        }`} />
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${event.type === 'High Alert' ? 'bg-red-500/20 text-red-400' :
                                                event.type === 'Info' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {event.type}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">{event.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-1">{event.message}</p>
                                    <p className="text-xs text-gray-500">Confidence: {event.confidence}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
