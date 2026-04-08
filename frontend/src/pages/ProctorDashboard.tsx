import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ShieldAlert, Users, Activity, Filter, BarChart2,
    Download, Search, AlertTriangle,
    UserX, Clock, ExternalLink, Camera, MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getExams, getExamViolations, getActiveSessions, getGlobalProctorStats, resumeStudentSession, downloadCheatingReport } from '../services/examService';
import { getSocket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from '../components/proctor/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { CandidateCard } from '../components/proctor/CandidateCard';

// Audio alert for new violations
const ALERT_SOUND = new Audio('/assets/sounds/notify_sound.mp3');
ALERT_SOUND.volume = 0.6;

export default function ProctorDashboard() {
    const { t } = useTranslation();
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>('all');
    const [violations, setViolations] = useState<any[]>([]);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        totalActive: 0,
        totalViolations: 0,
        totalSuspensions: 0
    });
    const [liveFeed, setLiveFeed] = useState<any[]>([]);
    const [view, setView] = useState<'monitor' | 'reports'>('monitor');
    const [examSearch, setExamSearch] = useState('');

    // Details Modal State
    const [selectedStudentViolations, setSelectedStudentViolations] = useState<any[] | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const fetchInitialData = async () => {
        try {
            const [allExams, v, sessions, globalStats] = await Promise.all([
                getExams(),
                getExamViolations(selectedExamId),
                getActiveSessions(selectedExamId),
                selectedExamId === 'all' ? getGlobalProctorStats() : Promise.resolve(null)
            ]);

            setExams(allExams.filter((e: any) => e.status !== 'draft'));
            setViolations(v);
            setActiveSessions(sessions);

            if (selectedExamId === 'all' && globalStats) {
                setStats(globalStats);
            } else {
                setStats({
                    totalActive: sessions.length,
                    totalViolations: v.length,
                    totalSuspensions: sessions.filter((s: any) => s.isSuspended).length
                });
            }
        } catch (error) {
            console.error('Failed to fetch proctor data:', error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [selectedExamId]);


    const ongoingExams = useMemo(() => {
        const now = new Date();
        return exams.filter(e => e.status === 'published' && new Date(e.endTime) > now && e.title.toLowerCase().includes(examSearch.toLowerCase()));
    }, [exams, examSearch]);

    const historicalExams = useMemo(() => {
        const now = new Date();
        return exams.filter(e => (e.status === 'closed' || e.status === 'archived' || (e.status === 'published' && new Date(e.endTime) <= now)) && e.title.toLowerCase().includes(examSearch.toLowerCase()));
    }, [exams, examSearch]);

    useEffect(() => {
        const socket = getSocket();
        socket.emit('join-room', 'global-proctor-room');

        const updateSession = (data: any, status: 'active' | 'submitted' | 'alert', isSuspended?: boolean) => {
            if (status === 'alert' && !isSuspended) {
                ALERT_SOUND.play().catch(() => { });
            }

            // Sync with stats
            if (status === 'alert') setStats(prev => ({ ...prev, totalViolations: prev.totalViolations + 1 }));
            if (isSuspended === true) setStats(prev => ({ ...prev, totalSuspensions: prev.totalSuspensions + 1 }));

            setActiveSessions(prev => {
                const sId = data.studentId;
                const existing = prev.find(s => (s.studentId?._id || s.studentId) === sId);

                if (existing) {
                    return prev.map(s => (s.studentId?._id || s.studentId) === sId ? {
                        ...s,
                        status,
                        isSuspended: isSuspended !== undefined ? isSuspended : s.isSuspended,
                        violationCount: status === 'alert' ? (s.violationCount || 0) + 1 : s.violationCount
                    } : s);
                }

                // If new student started, add them to the monitor
                if (status === 'active') {
                    return [{
                        studentId: data.studentId,
                        studentName: data.studentName,
                        studentRollNo: data.studentRollNo,
                        examId: data.examId,
                        status: 'active',
                        violationCount: 0,
                        isSuspended: false
                    }, ...prev];
                }
                return prev;
            });
        };

        const handleExamStart = (data: any) => {
            updateSession(data, 'active');
            // If the exam is not in our list yet, we might need to refresh exams or just trust the start event
            if (!exams.find(e => e._id === data.examId)) {
                setExams(prev => [...prev, { _id: data.examId, title: data.examTitle || 'New Exam', status: 'published' }]);
            }
        };

        const handleExamSubmit = (data: any) => {
            updateSession(data, 'submitted');
            // Maybe remove from active after some time or just keep as 'submitted'
        };

        const handleProctorAlert = (data: any) => {
            if (selectedExamId === 'all' || data.examId === selectedExamId) {
                updateSession(data, 'alert');

                // Update Feed
                setLiveFeed(prev => {
                    const existingIdx = prev.findIndex(item => item.studentId === data.studentId && item.type === data.alertType);
                    if (existingIdx > -1) {
                        const updated = [...prev];
                        updated[existingIdx] = {
                            ...updated[existingIdx],
                            timestamp: new Date(),
                            count: (updated[existingIdx].count || 1) + 1,
                            message: data.message,
                            studentRollNo: data.studentRollNo || updated[existingIdx].studentRollNo
                        };
                        return updated;
                    }
                    return [{ ...data, count: 1, timestamp: new Date() }, ...prev].slice(0, 50);
                });

                // Update Violations State (for Intelligence Hub / Reports)
                setViolations(prev => {
                    const newViolation = {
                        ...data,
                        studentId: { _id: data.studentId, name: data.studentName, rollNo: data.studentRollNo },
                        examId: { _id: data.examId, title: data.examTitle || 'Live Exam' },
                        timestamp: new Date().toISOString(),
                        type: data.alertType
                    };
                    return [newViolation, ...prev];
                });
            }
        };

        const handleSuspension = (data: any) => {
            if (selectedExamId === 'all' || data.examId === selectedExamId) {
                updateSession(data, 'alert', true);
                const suspensionAlert = { ...data, type: 'SUSPENSION', count: 1, message: data.reason, timestamp: new Date() };
                setLiveFeed(prev => [suspensionAlert, ...prev].slice(0, 50));
                
                // Add to violations table too
                setViolations(prev => [{
                    ...suspensionAlert,
                    studentId: { _id: data.studentId, name: data.studentName, rollNo: data.studentRollNo },
                    examId: { _id: data.examId, title: data.examTitle || 'Live Exam' },
                    timestamp: new Date().toISOString()
                }, ...prev]);
            }
        };

        const handleUnsuspension = (data: any) => {
            if (selectedExamId === 'all' || data.examId === selectedExamId) {
                updateSession(data, 'active', false);
                setLiveFeed(prev => [{
                    type: 'RESUMPTION',
                    studentName: data.studentName || 'System',
                    message: `Session resumed by proctor.`,
                    timestamp: new Date(),
                    studentId: data.studentId
                }, ...prev].slice(0, 50));
            }
        };

        socket.on('monitor-exam-start', handleExamStart);
        socket.on('monitor-exam-submit', handleExamSubmit);
        socket.on('monitor-proctor-alert', handleProctorAlert);
        socket.on('student-suspended', handleSuspension);
        socket.on('student-unsuspended', handleUnsuspension);

        return () => {
            socket.off('monitor-exam-start', handleExamStart);
            socket.off('monitor-exam-submit', handleExamSubmit);
            socket.off('monitor-proctor-alert', handleProctorAlert);
            socket.off('student-suspended', handleSuspension);
            socket.off('student-unsuspended', handleUnsuspension);
        };
    }, [selectedExamId, exams]);

    const consolidatedViolations = useMemo(() => {
        const grouped: Record<string, any> = {};

        violations.forEach(v => {
            const sId = v.studentId?._id || v.studentId || 'unknown';
            const eId = v.examId?._id || v.examId || 'unknown';
            const key = `${sId}-${eId}`;

            if (!grouped[key]) {
                grouped[key] = {
                    ...v,
                    types: new Set([v.type]),
                    count: 1,
                    allViolations: [v],
                    firstDetected: v.timestamp,
                    lastDetected: v.timestamp
                };
            } else {
                grouped[key].count += 1;
                grouped[key].types.add(v.type);
                grouped[key].allViolations.push(v);
                grouped[key].lastDetected = v.timestamp;
            }
        });

        return Object.values(grouped).filter((v: any) => {
            // Keep it broad so proctors can see all active/recent violations
            const studentName = (v.studentId?.name || '').toLowerCase();
            const studentRoll = (v.studentId?.rollNo || '').toLowerCase();
            const examTitle = (v.examId?.title || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            return studentName.includes(search) ||
                studentRoll.includes(search) ||
                examTitle.includes(search);
        }).sort((a: any, b: any) => new Date(b.lastDetected).getTime() - new Date(a.lastDetected).getTime());
    }, [violations, searchTerm]);

    const handleResume = async (examId: string, studentId: string) => {
        try {
            await resumeStudentSession(examId, studentId);
            setActiveSessions(prev => prev.map(s => {
                const sId = s.studentId?._id || s.studentId;
                return sId === studentId
                    ? { ...s, isSuspended: false }
                    : s;
            }));
            // Add resumption to live feed
            setLiveFeed(prev => [{
                type: 'RESUMPTION',
                studentName: 'Admin Action',
                message: `Resumed session for student`,
                timestamp: new Date()
            }, ...prev].slice(0, 50));
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to resume session');
        }
    };

    const handleSendWarning = (studentId: string, studentName: string) => {
        const socket = getSocket();
        socket.emit('intercom-message', {
            examId: selectedExamId,
            studentId,
            message: "PROCTOR ALERT: Please ensure you are strictly following proctoring guidelines. Further violations will result in automatic suspension.",
            sender: "Proctor"
        });
        
        setLiveFeed(prev => [{
            type: 'WARNING',
            studentName: studentName,
            message: `Official warning issued to candidate.`,
            timestamp: new Date()
        }, ...prev].slice(0, 50));
    };

    const sortedActiveSessions = useMemo(() => {
        return [...activeSessions].sort((a, b) => {
            // Severity-based sorting: Suspended or high violations first
            if (a.isSuspended !== b.isSuspended) return a.isSuspended ? -1 : 1;
            return (b.violationCount || 0) - (a.violationCount || 0);
        });
    }, [activeSessions]);

    const handleExportDefaulters = async () => {
        try {
            // Find the title of the selected exam for the filename, or use 'Global'
            const selectedExam = exams.find(e => e._id === selectedExamId);
            const examTitle = selectedExam ? selectedExam.title : 'Global_Intelligence';
            
            await downloadCheatingReport(selectedExamId, examTitle);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export report. Please ensure violations exist for the selected scope.');
        }
    };

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                        <ShieldAlert className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            PROCTOR COMMAND <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse uppercase">Live</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold italic text-sm">Real-time Session Auditing & Compliance Control</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                    <button onClick={() => setView('monitor')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'monitor' ? 'bg-primary text-white shadow-lg scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                        <Activity className="h-4 w-4 inline mr-2" /> {t('proctor_dashboard.monitor')}
                    </button>
                    <button onClick={() => setView('reports')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'reports' ? 'bg-primary text-white shadow-lg scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                        <BarChart2 className="h-4 w-4 inline mr-2" /> {t('proctor_dashboard.intelligence_hub')}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard label="Live Candidates" value={stats.totalActive} icon={Users} color="blue" />
                <StatCard label="Total Incidents" value={stats.totalViolations} icon={ShieldAlert} color="orange" />
                <StatCard label="Suspended Sessions" value={stats.totalSuspensions} icon={UserX} color="red" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Controls */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 text-center">Scope Filter</label>
                        <div className="space-y-3">
                            <div className="relative group/search">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within/search:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search Exam Name..."
                                    value={examSearch}
                                    onChange={(e) => setExamSearch(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-black text-slate-700 dark:text-slate-200 outline-none focus:border-primary transition-all appearance-none uppercase tracking-tighter"
                                >
                                    <option value="all">Global (All Active Exams)</option>
                                    {ongoingExams.length > 0 && (
                                        <optgroup label="Published Exams (Ongoing)">
                                            {ongoingExams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                                        </optgroup>
                                    )}
                                    {historicalExams.length > 0 && (
                                        <optgroup label="Historical/Ended Exams">
                                            {historicalExams.map(e => <option key={e._id} value={e._id}>{e.title} (Ended)</option>)}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <AlertTriangle className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                        <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                            System Status
                        </h4>
                        <p className="text-xs text-blue-100 mb-4 font-medium leading-relaxed opacity-90">
                            Monitoring engines are fully operational. Socket latency is minimal.
                        </p>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                            <span>Engine V2.4</span>
                            <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-green-400" /> SYNCED</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="xl:col-span-3">
                    {view === 'monitor' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
                            {/* Incident Flow */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Incident Stream</h3>
                                    <span className="animate-pulse flex items-center gap-1 text-[10px] font-black text-red-500">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" /> LIVE
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px] thin-scrollbar">
                                    <AnimatePresence>
                                        {liveFeed.length === 0 ? (
                                            <EmptyState icon={Clock} title="Monitoring Secures" text="Waiting for live telemetry from active candidate sessions." />
                                        ) : (
                                            liveFeed.map((alert, i) => (
                                                <motion.div
                                                    key={alert.studentId + alert.type + i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`p-5 rounded-[2rem] border-2 flex items-start gap-4 transition-all shadow-sm hover:shadow-xl ${alert.type === 'SUSPENSION' ? 'bg-red-50 dark:bg-red-900/10 border-red-500 shadow-red-500/10' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
                                                >
                                                    <div className={`p-4 rounded-2xl shrink-0 shadow-inner ${alert.type === 'SUSPENSION' ? 'bg-red-500 text-white' : 'bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400'}`}>
                                                        <ShieldAlert className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${alert.type === 'SUSPENSION' ? 'bg-red-600/20 text-red-600' : 'bg-orange-500/10 text-orange-500'}`}>
                                                                    {alert.type}
                                                                </span>
                                                                {alert.count > 1 && (
                                                                    <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-bounce shadow-lg">
                                                                        {alert.count} ATTEMPTS
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-mono font-bold text-slate-300 dark:text-slate-600 tabular-nums">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                        <div className="flex flex-col mb-2">
                                                            <p className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight uppercase tracking-tight">{alert.studentName}</p>
                                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest bg-slate-100 dark:bg-slate-800 w-fit px-2 py-0.5 rounded mt-1">ROLL: {alert.studentRollNo || 'N/A'}</span>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic truncate">"{alert.message}"</p>
                                                        </div>
                                                        {alert.snapshot && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <Camera className="h-3 w-3 text-blue-400 shrink-0" />
                                                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Evidence Captured</span>
                                                                <img
                                                                    src={alert.snapshot}
                                                                    alt="Violation snapshot"
                                                                    className="h-12 w-16 object-cover rounded-lg border-2 border-blue-500/30 shadow-md cursor-pointer hover:scale-150 transition-transform origin-left"
                                                                />
                                                            </div>
                                                        )}
                                                        {/* Voice Transcript Evidence */}
                                                        {alert.transcript && (
                                                            <div className="mt-2 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2 border border-amber-200/50 dark:border-amber-800/30">
                                                                <MessageSquare className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block">Voice Transcript</span>
                                                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium italic leading-relaxed">"{alert.transcript}"</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Session Monitor */}
                            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Candidate Monitor</h3>
                                    <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">{activeSessions.length} ONLINE</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 gap-6 max-h-[600px] thin-scrollbar content-start items-start">
                                    {sortedActiveSessions.map((session, i) => (
                                        <div key={session._id || i} className="relative group">
                                            <CandidateCard session={session} onResume={handleResume} />
                                            {!session.isSuspended && (
                                                <button
                                                    onClick={() => handleSendWarning(session.studentId?._id || session.studentId, session.studentName)}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500 text-white p-2 rounded-lg shadow-lg hover:bg-amber-600 z-10"
                                                    title="Issue Warning"
                                                >
                                                    <AlertTriangle className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {activeSessions.length === 0 && (
                                        <div className="col-span-2 py-20">
                                            <EmptyState icon={Users} title="Idle Monitor" text="No active exam sessions found for the current filter." />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/20 dark:bg-slate-800/20">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{t('proctor_dashboard.intelligence_hub')}</h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Search and export historically logged violations</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder={t('proctor_dashboard.search_placeholder')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-all shadow-sm dark:text-slate-100"
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleExportDefaulters} className="rounded-xl shadow-lg shrink-0 h-10 px-6 font-black uppercase text-xs tracking-widest">
                                        <Download className="h-4 w-4 mr-2" /> {t('proctor_dashboard.export_report')}
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-x-auto thin-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/70 dark:bg-slate-800/70 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter">
                                            <th className="px-6 py-4">Examination</th>
                                            <th className="px-6 py-4">Candidate Identity</th>
                                            <th className="px-6 py-4">Violation Type</th>
                                            <th className="px-6 py-4">Attempts</th>
                                            <th className="px-6 py-4">Last Logged</th>
                                            <th className="px-6 py-4 text-center">Action Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {consolidatedViolations.map((v, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b dark:border-slate-800/50 last:border-0">
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded max-w-[150px] inline-block truncate shadow-sm">{v.examId?.title}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{v.studentId?.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">ROLL: {v.studentId?.rollNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {Array.from(v.types).map((type: any) => (
                                                            <span key={type} className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${type === 'SUSPENSION' ? 'bg-red-500 text-white' : 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'}`}>
                                                                {type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-black px-3 py-1 rounded-full border border-red-100 dark:border-red-900/30">
                                                        {v.count}x
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-mono text-slate-400 dark:text-slate-600 font-bold uppercase tracking-tighter">
                                                    {new Date(v.lastDetected || v.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStudentViolations(v.allViolations);
                                                                setDetailsModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all group"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                                            <span className="text-[10px] font-black uppercase tracking-tight">{t('proctor_dashboard.view_details')}</span>
                                                        </button>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${v.isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {v.isSuspended ? '🚫 BLOCKED' : '✅ ACTIVE'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Forensic Details Modal */}
            <AnimatePresence>
                {detailsModalOpen && selectedStudentViolations && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Forensic Timeline</h3>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Chronological violation audit for {selectedStudentViolations[0]?.studentId?.name}</p>
                                </div>
                                <button
                                    onClick={() => setDetailsModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 thin-scrollbar">
                                {selectedStudentViolations.map((v, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="h-3 w-3 rounded-full bg-primary mt-1.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                            {i !== selectedStudentViolations.length - 1 && <div className="w-[2px] flex-1 bg-slate-100 dark:bg-slate-800" />}
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.type === 'SUSPENSION' ? 'bg-red-500 text-white' : 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'}`}>
                                                    {v.type}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 shadow-sm">
                                                    {new Date(v.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-sm group-hover:bg-white dark:group-hover:bg-slate-800 transition-all">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">"{v.message}"</p>
                                            </div>
                                            {v.snapshot && (
                                                <div className="mt-2 bg-slate-900/5 dark:bg-slate-800/50 rounded-xl p-3 border border-blue-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Camera className="h-3 w-3 text-blue-400" />
                                                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Forensic Evidence — Camera Capture</span>
                                                    </div>
                                                    <img
                                                        src={v.snapshot}
                                                        alt={`Evidence: ${v.type}`}
                                                        className="w-full max-w-xs rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-lg"
                                                    />
                                                </div>
                                            )}
                                            {/* Voice Transcript Evidence */}
                                            {v.transcript && (
                                                <div className="mt-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-800/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="h-3 w-3 text-amber-500" />
                                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Forensic Evidence — Voice Transcript</span>
                                                    </div>
                                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium italic leading-relaxed bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg">"{v.transcript}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <Button onClick={() => setDetailsModalOpen(false)} variant="primary" className="rounded-xl px-8 font-black uppercase text-xs tracking-widest h-10 shadow-lg">
                                    CLOSE AUDIT
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
