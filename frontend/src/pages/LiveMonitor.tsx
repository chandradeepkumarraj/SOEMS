import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AlertCircle, User, Monitor, ShieldAlert, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SOCKET_URL } from '../config';
import { Link } from 'react-router-dom';

interface StudentSession {
    studentId: string;
    examId: string;
    status: 'active' | 'submitted' | 'alert';
    lastAlert?: string;
    name?: string; // Placeholder for real name mapping
}

export default function LiveMonitor() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [sessions, setSessions] = useState<StudentSession[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            addLog('Connected to Proctoring Server');
            // Join a "global-monitor" room if needed
        });

        newSocket.on('monitor-exam-start', (data) => {
            addLog(`Student ${data.studentId} started exam ${data.examId}`);
            updateSession(data.studentId, data.examId, 'active');
        });

        newSocket.on('monitor-exam-submit', (data) => {
            addLog(`Student ${data.studentId} submitted exam ${data.examId}`);
            updateSession(data.studentId, data.examId, 'submitted');
        });

        newSocket.on('monitor-proctor-alert', (data) => {
            addLog(`ALERT: ${data.message} (${data.studentId})`);
            updateSession(data.studentId, data.examId, 'alert', data.alertType);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const updateSession = (studentId: string, examId: string, status: StudentSession['status'], alert?: string) => {
        setSessions(prev => {
            const existing = prev.find(s => s.studentId === studentId);
            if (existing) {
                return prev.map(s => s.studentId === studentId ? { ...s, status, lastAlert: alert || s.lastAlert } : s);
            }
            return [...prev, { studentId, examId, status, lastAlert: alert }];
        });
    };

    // Simulation for Demo
    const simulateAlert = () => {
        if (!socket) return;
        const mockStudentId = 'student-' + Math.floor(Math.random() * 1000);
        socket.emit('proctor-alert', {
            examId: 'demo-exam',
            studentId: mockStudentId,
            alertType: 'Tab Switch',
            message: 'User switched tabs'
        });
        socket.emit('join-room', 'demo-exam');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="flex justify-between items-center mb-8">
                <Link to="/admin/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Monitor className="text-primary" /> Live Proctoring Dashboard
                    </h1>
                    <p className="text-gray-500">Real-time monitoring of active exam sessions.</p>
                </div>
                <Button onClick={simulateAlert} variant="outline">Simulate Alert (Demo)</Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="font-semibold text-lg">Active Sessions</h2>
                    {sessions.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                            Waiting for exam activity...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {sessions.map(session => (
                                <div key={session.studentId} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white border-gray-200 relative overflow-hidden ${session.status === 'alert' ? 'border-l-red-500' : session.status === 'submitted' ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-100 p-2 rounded-full">
                                                <User className="h-4 w-4 text-gray-600" />
                                            </div>
                                            <span className="font-medium text-sm">{session.studentId}</span>
                                        </div>
                                        {session.status === 'alert' && <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />}
                                        {session.status === 'submitted' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500">Exam: {session.examId}</p>
                                        <p className={`text-xs font-bold uppercase ${session.status === 'alert' ? 'text-red-600' : session.status === 'submitted' ? 'text-green-600' : 'text-blue-600'}`}>{session.status}</p>
                                        {session.lastAlert && (
                                            <p className="text-xs text-red-500 mt-2 bg-red-50 p-1 rounded">Risk: {session.lastAlert}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Event Log */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        <h3 className="font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Live Events Log
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                        {logs.map((log, i) => (
                            <div key={i} className="border-b border-gray-100 pb-2 last:border-0 text-gray-600">
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-center text-gray-400 mt-10">No events yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
