import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';
import { AlertCircle, User, Monitor, ShieldAlert, CheckCircle, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

interface Violation {
    type: string;
    message: string;
    timestamp: string;
}

interface StudentSession {
    studentId: string;
    examId: string;
    status: 'active' | 'submitted' | 'alert';
    lastAlert?: string;
    name?: string;
    violations: Violation[];
}

export default function LiveMonitor() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [sessions, setSessions] = useState<StudentSession[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const s = getSocket();
        setSocket(s);

        const onConnect = () => {
            addLog('Connected to Proctoring Server');
            s.emit('join-room', 'global-proctor-room');
        };

        if (s.connected) {
            onConnect();
        }

        s.on('connect', onConnect);

        s.on('monitor-exam-start', (data) => {
            addLog(`Student ${data.studentId} started exam ${data.examId}`);
            updateSession(data.studentId, data.examId, 'active');
        });

        s.on('monitor-exam-submit', (data) => {
            addLog(`Student ${data.studentId} submitted exam ${data.examId}`);
            updateSession(data.studentId, data.examId, 'submitted');
        });

        s.on('monitor-proctor-alert', (data) => {
            addLog(`CRITICAL: ${data.alertType} from ${data.studentId}`);
            updateSession(data.studentId, data.examId, 'alert', data.alertType, data.message);
        });

        return () => {
            s.off('connect', onConnect);
            s.off('monitor-exam-start');
            s.off('monitor-exam-submit');
            s.off('monitor-proctor-alert');
        };
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const updateSession = (studentId: string, examId: string, status: StudentSession['status'], alertType?: string, alertMessage?: string) => {
        setSessions(prev => {
            const existing = prev.find(s => s.studentId === studentId);
            const newViolation = alertType ? {
                type: alertType,
                message: alertMessage || '',
                timestamp: new Date().toLocaleTimeString()
            } : null;

            if (existing) {
                return prev.map(s => s.studentId === studentId ? {
                    ...s,
                    status,
                    lastAlert: alertType || s.lastAlert,
                    violations: newViolation ? [newViolation, ...s.violations].slice(0, 10) : s.violations
                } : s);
            }
            return [...prev, {
                studentId,
                examId,
                status,
                lastAlert: alertType,
                violations: newViolation ? [newViolation] : []
            }];
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
                                <div key={session.studentId} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white border-gray-200 transition-all duration-300 ${session.status === 'alert' ? 'border-l-red-500 ring-2 ring-red-100' : session.status === 'submitted' ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-100 p-2 rounded-full">
                                                <User className="h-4 w-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm block">{session.studentId}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">Exam: {session.examId}</span>
                                            </div>
                                        </div>
                                        {session.status === 'alert' && <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />}
                                        {session.status === 'submitted' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${session.status === 'alert' ? 'text-red-600' : session.status === 'submitted' ? 'text-green-600' : 'text-blue-600'}`}>{session.status}</span>
                                            {session.violations.length > 0 && (
                                                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                    {session.violations.length} violations
                                                </span>
                                            )}
                                        </div>

                                        {session.violations.length > 0 && (
                                            <div className="mt-3 space-y-1 max-h-24 overflow-y-auto pr-1">
                                                <p className="text-[9px] font-bold text-gray-400 mb-1 flex items-center gap-1 uppercase tracking-tighter">
                                                    <History className="h-2.5 w-2.5" /> Violation History
                                                </p>
                                                {session.violations.map((v, i) => (
                                                    <div key={i} className="text-[10px] bg-red-50/50 p-1.5 rounded border border-red-100 flex justify-between items-start gap-1">
                                                        <span className="text-red-700 font-medium leading-tight">
                                                            <span className="font-bold">[{v.type}]</span> {v.message}
                                                        </span>
                                                        <span className="text-gray-400 whitespace-nowrap">{v.timestamp}</span>
                                                    </div>
                                                ))}
                                            </div>
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
