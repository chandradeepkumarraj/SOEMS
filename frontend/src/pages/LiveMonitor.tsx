import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';
import {
    User, Monitor, ShieldAlert,
    BarChart2, Download, Users, AlertTriangle,
    Search, Activity, LayoutGrid, Clock, ShieldCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { getExams, getActiveSessions, getCheatingAnalysis, downloadCheatingReport, resumeStudentSession } from '../services/examService';

// Audio alert for new violations
const ALERT_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
ALERT_SOUND.volume = 0.4;

interface Violation {
    type: string;
    message: string;
    timestamp: string;
}

interface StudentSession {
    studentId: string;
    rollNo?: string;
    examId: string;
    status: 'active' | 'submitted' | 'alert';
    lastAlert?: string;
    name?: string;
    violations: Violation[];
    violationCounts: Record<string, number>; // Grouped by type
    totalViolations: number;
    isSuspended?: boolean;
}

interface CheatingMetric {
    examId: string;
    examTitle: string;
    totalParticipants: number;
    activeParticipants: number;
    totalViolations: number;
    flaggedStudents: number;
    suspensions: number;
    lastIncidentAt?: string;
}

interface GlobalStats {
    totalParticipants: number;
    totalViolations: number;
    totalSuspensions: number;
    integrityScore: number;
    systemEfficacy: number;
}

export default function LiveMonitor() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [sessions, setSessions] = useState<StudentSession[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [runningExams, setRunningExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>('all');
    const [loadingExams, setLoadingExams] = useState(true);

    // New Analytics State
    const [activeTab, setActiveTab] = useState<'live' | 'analytics'>('live');
    const [cheatingStats, setCheatingStats] = useState<CheatingMetric[]>([]);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const s = getSocket();
        setSocket(s);

        const onConnect = () => {
            addLog('Connected to Proctoring Server');
            s.emit('join-room', 'global-proctor-room');
        };

        if (s.connected) onConnect();
        s.on('connect', onConnect);

        s.on('monitor-exam-start', (data) => {
            addLog(`Student ${data.studentName || data.studentId} started exam ${data.examId}`);
            updateSession(data.studentId, data.examId, 'active', undefined, undefined, data.studentName, data.studentRollNo);
        });

        s.on('monitor-exam-submit', (data) => {
            addLog(`Student ${data.studentName || data.studentId} submitted exam ${data.examId}`);
            updateSession(data.studentId, data.examId, 'submitted', undefined, undefined, data.studentName, data.studentRollNo);
        });

        const onAlert = (data: any) => {
            updateSession(data.studentId, data.examId, 'alert', data.alertType, data.message, data.studentName, data.studentRollNo);
            addLog(`ALERT: ${data.studentName || data.studentId} - ${data.alertType}`);
        };

        const onSuspended = (data: any) => {
            updateSession(data.studentId, data.examId, 'alert', 'SUSPENDED', data.reason, data.studentName, data.studentRollNo, true);
            addLog(`SUSPENDED: ${data.studentName || data.studentId} (Threshold Reached)`);
        };

        const onUnsuspended = (data: any) => {
            updateSession(data.studentId, data.examId, 'active', 'RESUMED', 'Proctor cleared violations', undefined, undefined, false);
            addLog(`RESUMED: Session for student ${data.studentId.slice(-6).toUpperCase()}`);
        };

        s.on('monitor-proctor-alert', onAlert);
        s.on('student-suspended', onSuspended);
        s.on('student-unsuspended', onUnsuspended);

        return () => {
            s.off('connect', onConnect);
            s.off('monitor-exam-start');
            s.off('monitor-exam-submit');
            s.off('monitor-proctor-alert', onAlert);
            s.off('student-suspended', onSuspended);
            s.off('student-unsuspended', onUnsuspended);
        };
    }, []);

    // Fetch data based on tab
    useEffect(() => {
        const loadExams = async () => {
            try {
                const allExams = await getExams();
                // Sort by date descending (LIFO) and filter for ongoing/scheduled
                const sorted = allExams
                    .filter((e: any) => e.status === 'published' || e.status === 'scheduled')
                    .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

                setRunningExams(sorted);
                setLoadingExams(false);
            } catch (err) {
                console.error('Failed to load exams:', err);
            }
        };
        loadExams();
    }, []);

    useEffect(() => {
        if (activeTab === 'live') {
            const loadActiveSessions = async () => {
                try {
                    const active = await getActiveSessions(selectedExamId);
                    const formatted = active.map((s: any) => ({
                        studentId: s.studentId?._id || s.studentId,
                        rollNo: s.studentId?.rollNo || 'N/A',
                        name: s.studentId?.name || 'Unknown Student',
                        examId: s.examId?._id || s.examId,
                        status: s.isSuspended ? 'alert' : 'active',
                        violations: [],
                        violationCounts: {},
                        totalViolations: 0,
                        isSuspended: s.isSuspended
                    }));
                    setSessions(formatted);
                } catch (err) {
                    console.error('Failed to load active sessions:', err);
                }
            };
            loadActiveSessions();
        } else if (activeTab === 'analytics') {
            fetchAnalytics();
        }
    }, [selectedExamId, activeTab]);

    const fetchAnalytics = async () => {
        setLoadingStats(true);
        try {
            const data = await getCheatingAnalysis();
            setCheatingStats(data.exams);
            setGlobalStats(data.global);
        } catch (err) {
            console.error('Failed to fetch cheating stats');
        } finally {
            setLoadingStats(false);
        }
    };

    const handleDownload = async (examId: string, title: string) => {
        try {
            await downloadCheatingReport(examId, title);
        } catch (err) {
            alert('Failed to download report. Ensure violations exist for this exam.');
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const handleResume = async (examId: string, studentId: string) => {
        try {
            await resumeStudentSession(examId, studentId);
            setSessions(prev => prev.map(s =>
                (s.studentId === studentId && s.examId === examId)
                    ? { ...s, isSuspended: false, status: 'active' }
                    : s
            ));
            addLog(`RESUMED session for student ${studentId.slice(-6).toUpperCase()}`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to resume session');
        }
    };

    const updateSession = (studentId: string, examId: string, status: StudentSession['status'], alertType?: string, alertMessage?: string, studentName?: string, rollNo?: string, isSuspended?: boolean) => {
        if (alertType) {
            ALERT_SOUND.play().catch(() => { }); // Play soft alert on new violation
        }

        setSessions(prev => {
            const existing = prev.find(s => s.studentId === studentId);
            const newViolation = alertType ? {
                type: alertType,
                message: alertMessage || '',
                timestamp: new Date().toLocaleTimeString()
            } : null;

            if (existing) {
                const updatedViolations = newViolation ? [newViolation, ...existing.violations].slice(0, 10) : existing.violations;
                const updatedCounts = { ...existing.violationCounts };
                if (alertType) {
                    updatedCounts[alertType] = (updatedCounts[alertType] || 0) + 1;
                }

                return prev.map(s => s.studentId === studentId ? {
                    ...s,
                    status,
                    name: studentName || s.name,
                    rollNo: rollNo || s.rollNo,
                    lastAlert: alertType || s.lastAlert,
                    violations: updatedViolations,
                    violationCounts: updatedCounts,
                    totalViolations: existing.totalViolations + (alertType ? 1 : 0),
                    isSuspended: isSuspended !== undefined ? isSuspended : s.isSuspended
                } : s);
            }

            const initialCounts: Record<string, number> = {};
            if (alertType) initialCounts[alertType] = 1;

            return [{
                studentId,
                rollNo,
                examId,
                status,
                name: studentName,
                lastAlert: alertType,
                violations: newViolation ? [newViolation] : [],
                violationCounts: initialCounts,
                totalViolations: alertType ? 1 : 0,
                isSuspended: isSuspended || false
            }, ...prev].slice(0, 100); // Limit total tracked sessions to 100 for performance
        });
    };

    const simulateAlert = () => {
        if (!socket) return;
        const mockStudentId = 'student-' + Math.floor(Math.random() * 1000);
        const examIdToUse = selectedExamId === 'all' ? (runningExams[0]?._id || 'demo-exam') : selectedExamId;

        socket.emit('proctor-alert', {
            examId: examIdToUse,
            studentId: mockStudentId,
            studentName: 'Mock Student',
            alertType: 'Tab Switch',
            message: 'User switched tabs'
        });
    };

    const filteredSessions = selectedExamId === 'all'
        ? sessions
        : sessions.filter(s => s.examId === selectedExamId);

    const filteredStats = cheatingStats.filter(s =>
        s.examTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 transition-colors duration-300">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-1">
                    <Link to="/admin/dashboard" className="text-sm font-bold text-primary flex items-center gap-1 mb-2 hover:opacity-75 transition-opacity">
                        <LayoutGrid className="h-4 w-4" /> Admin Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        Proctor Intelligence <span className="bg-red-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full tracking-widest font-black animate-pulse">Live</span>
                    </h1>
                    <p className="text-neutral-500 dark:text-slate-400 text-sm font-medium">Monitoring and analyzing platform integrity in real-time.</p>
                </div>

                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-neutral-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'live' ? 'bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800'}`}
                    >
                        <Activity className="h-4 w-4" /> LIVE MONITOR
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'analytics' ? 'bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800'}`}
                    >
                        <BarChart2 className="h-4 w-4" /> INTELLIGENCE HUB
                    </button>
                </div>
            </header>

            {activeTab === 'live' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Control Panel */}
                    <div className="lg:col-span-12 flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-sm mb-2">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-1">Focus Exam Room</span>
                                <select
                                    className="bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-4 focus:ring-primary/10 select-none outline-none min-w-[280px] dark:text-slate-100"
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                    disabled={loadingExams}
                                >
                                    <option value="all">🌐 Global (All Running Exams)</option>
                                    {!loadingExams && runningExams.map(exam => (
                                        <option key={exam._id} value={exam._id}>📝 {exam.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="h-10 w-[1px] bg-neutral-100 dark:bg-slate-800 hidden md:block"></div>

                            <div className="hidden md:flex flex-col">
                                <span className="text-[10px] font-black text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-1">Active Streams</span>
                                <span className="text-xl font-black text-neutral-900 dark:text-slate-100">{filteredSessions.length}</span>
                            </div>
                        </div>

                        <Button onClick={simulateAlert} variant="outline" className="border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 font-black rounded-xl text-xs flex items-center gap-2 h-11 px-6">
                            <ShieldAlert className="h-4 w-4" /> SIMULATE BREACH
                        </Button>
                    </div>

                    {/* Active Grid */}
                    <div className="lg:col-span-8 space-y-6">
                        {filteredSessions.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-24 rounded-3xl border border-dashed border-neutral-300 dark:border-slate-700 text-center flex flex-col items-center gap-4">
                                <div className="bg-neutral-50 dark:bg-slate-800 p-6 rounded-full">
                                    <Monitor className="h-12 w-12 text-neutral-200 dark:text-slate-600" />
                                </div>
                                <div className="max-w-xs transition-opacity duration-300">
                                    <h3 className="font-black text-neutral-900 dark:text-slate-100 text-lg">Waiting for Stream...</h3>
                                    <p className="text-neutral-400 dark:text-slate-500 text-sm mt-1">Connect a student or use simulation to see live proctoring data.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredSessions.map(session => (
                                    <div key={session.studentId} className={`group bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border-2 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden ${session.status === 'alert' ? 'border-red-500 ring-4 ring-red-500/10' : session.status === 'submitted' ? 'border-green-500' : 'border-blue-500'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-4 rounded-2xl shadow-inner ${session.status === 'alert' ? 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                    <User className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight">{session.name || "Student"}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">RNO: {session.rollNo || 'N/A'}</span>
                                                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">ID: {session.studentId.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {session.status === 'alert' && <div className="h-3 w-3 bg-red-500 rounded-full animate-ping shadow-[0_0_15px_rgba(239,68,68,0.8)]" />}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mb-6">
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm ${session.isSuspended ? 'bg-red-600 text-white' : session.status === 'alert' ? 'bg-red-500 text-white' : session.status === 'submitted' ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'}`}>
                                                {session.isSuspended ? 'SUSPENDED' : session.status}
                                            </span>
                                            {session.totalViolations > 0 && (
                                                <span className="bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] px-3 py-1 rounded-xl font-black tracking-tighter flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                                    {session.totalViolations} INCIDENTS
                                                </span>
                                            )}
                                            {session.isSuspended && (
                                                <button
                                                    onClick={() => handleResume(session.examId, session.studentId)}
                                                    className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-4 py-1.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                                                >
                                                    <Activity className="h-3 w-3" /> RESUME SESSION
                                                </button>
                                            )}
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Incident Breakdown</p>
                                                {Object.keys(session.violationCounts).length === 0 && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                                            </div>

                                            {Object.keys(session.violationCounts).length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.keys(session.violationCounts).map(type => (
                                                        <div key={type} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl shadow-sm">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                            <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{type}</span>
                                                            <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 rounded-md">{session.violationCounts[type]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-2 flex items-center gap-3">
                                                    <div className="h-1 w-12 bg-emerald-400 rounded-full" />
                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Session Clean</span>
                                                </div>
                                            )}
                                        </div>

                                        {session.violations.length > 0 && (
                                            <div className="space-y-2 mt-6 max-h-40 overflow-y-auto thin-scrollbar pr-1 border-t border-slate-50 dark:border-slate-800 pt-5">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Timeline Events</p>
                                                {session.violations.map((v, i) => (
                                                    <div key={i} className="flex gap-3 group/item">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] mt-1" />
                                                            {i !== session.violations.length - 1 && <div className="w-[1.5px] flex-1 bg-slate-100 dark:bg-slate-800" />}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tabular-nums">{v.type}</span>
                                                                <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 tabular-nums">{v.timestamp}</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-[1.4] opacity-80 group-hover/item:opacity-100 transition-opacity italic">"{v.message}"</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Security Logs Partition */}
                    <div className="lg:col-span-4 h-full">
                        <div className="bg-[#121212] rounded-3xl shadow-2xl h-[700px] flex flex-col border border-neutral-800 overflow-hidden">
                            <div className="p-6 border-b border-neutral-800 bg-[#1a1a1a]">
                                <h3 className="text-white font-black flex items-center gap-3 text-sm tracking-widest uppercase">
                                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" /> Security Pulse Log
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[11px] thin-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className={`pb-3 border-b border-neutral-800 last:border-0 leading-relaxed ${log.includes('CRITICAL') ? 'text-red-400 font-bold' : 'text-neutral-500'}`}>
                                        <span className="opacity-30 inline-block mr-2">[{logs.length - i}]</span> {log}
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                                        <Activity className="h-10 w-10 text-neutral-500 mb-2" />
                                        <p className="text-neutral-500 uppercase font-black tracking-widest">System Idle</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                    {/* Analytics Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl">
                                    <Users className="h-5 w-5" />
                                </div>
                                <h3 className="font-black text-neutral-400 dark:text-slate-500 text-[10px] uppercase tracking-widest">Total Monitored</h3>
                            </div>
                            <div className="text-4xl font-black text-neutral-900 dark:text-slate-100">
                                {globalStats?.totalParticipants || 0}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-500 text-white rounded-2xl">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <h3 className="font-black text-neutral-400 dark:text-slate-500 text-[10px] uppercase tracking-widest">Critical Flags</h3>
                            </div>
                            <div className="text-4xl font-black text-neutral-900 dark:text-slate-100">
                                {globalStats?.totalViolations || 0}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-orange-500 text-white rounded-2xl">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <h3 className="font-black text-neutral-400 dark:text-slate-500 text-[10px] uppercase tracking-widest">Suspensions</h3>
                            </div>
                            <div className="text-4xl font-black text-neutral-900 dark:text-slate-100">
                                {globalStats?.totalSuspensions || 0}
                            </div>
                        </div>
                        <div className="bg-emerald-500 dark:bg-emerald-600 p-8 rounded-3xl shadow-xl border-none">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 text-white rounded-2xl">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h3 className="font-black text-white/70 text-[10px] uppercase tracking-widest">Integrity Score</h3>
                            </div>
                            <div className="text-4xl font-black text-white">{globalStats?.integrityScore || 100}%</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-8 border-b border-neutral-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-black text-neutral-900 dark:text-slate-100 tracking-tight">Intelligence Hub (All Exams)</h2>
                                <p className="text-neutral-400 dark:text-slate-500 text-sm font-medium">Detailed cheating forensics and participation tracking.</p>
                            </div>
                            <div className="relative group">
                                <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 dark:text-slate-600 group-focus-within:text-primary" />
                                <input
                                    type="text"
                                    placeholder="Search by exam title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-6 py-3 border border-neutral-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none w-[340px] bg-neutral-50 dark:bg-slate-950 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50/50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-neutral-400 dark:text-slate-500 uppercase tracking-widest">Exam Identifer</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-neutral-400 dark:text-slate-500 uppercase tracking-widest text-center">Participation</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-neutral-400 dark:text-slate-500 uppercase tracking-widest text-center">Security (Flags)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-neutral-400 dark:text-slate-500 uppercase tracking-widest text-center">Actions taken</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-neutral-400 dark:text-slate-500 uppercase tracking-widest text-right">Reporting</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                                    {loadingStats ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Clock className="h-8 w-8 text-neutral-200 animate-spin" />
                                                    <p className="text-neutral-400 font-bold text-sm">Aggregating real-time data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStats.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-neutral-400 font-bold uppercase tracking-widest text-xs opacity-50">
                                                No intelligence data found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStats.map((stat) => (
                                            <tr key={stat.examId} className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/50 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-neutral-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-neutral-400 dark:text-slate-500 font-black text-xs">
                                                            {stat.examTitle.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <span className="font-black text-neutral-800 dark:text-slate-100 text-sm block">{stat.examTitle}</span>
                                                            <span className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-tight">ID: {stat.examId.slice(-8).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="text-xs font-black text-neutral-900 dark:text-slate-100">{stat.activeParticipants} / {stat.totalParticipants} ACTIVE</div>
                                                        <div className="w-32 h-1.5 bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full"
                                                                style={{ width: `${(stat.activeParticipants / (stat.totalParticipants || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black ${stat.totalViolations > 10 ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400'}`}>
                                                        {stat.totalViolations} FLAGS ({stat.flaggedStudents} USERS)
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${stat.suspensions > 0 ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'}`}>
                                                        {stat.suspensions > 0 ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                                                        {stat.suspensions} Actioned
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleDownload(stat.examId, stat.examTitle)}
                                                        className="p-3 bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-100 rounded-2xl hover:bg-neutral-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 transition-all shadow-sm flex items-center gap-2 ml-auto"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        <span className="text-xs font-black uppercase tracking-tight hidden md:inline">FORENSIC REPORT</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
