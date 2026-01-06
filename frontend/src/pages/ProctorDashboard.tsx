import { useState, useEffect, useMemo } from 'react';
import {
    ShieldAlert, Users, Activity, Filter, BarChart2,
    Download, Search, AlertTriangle,
    UserX, Clock, ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getExams, getExamViolations, getActiveSessions, getGlobalProctorStats } from '../services/examService';
import { getSocket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProctorDashboard() {
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

    useEffect(() => {
        const socket = getSocket();
        socket.emit('join-room', 'global-proctor-room');

        const handleProctorAlert = (data: any) => {
            if (selectedExamId === 'all' || data.examId === selectedExamId) {
                // Group violations by student in the feed
                setLiveFeed(prev => {
                    const existingIdx = prev.findIndex(item => item.studentId === data.studentId && item.type === data.alertType);
                    if (existingIdx > -1) {
                        const updated = [...prev];
                        updated[existingIdx] = {
                            ...updated[existingIdx],
                            timestamp: new Date(),
                            count: (updated[existingIdx].count || 1) + 1,
                            message: data.message, // Keep latest message
                            studentRollNo: data.studentRollNo || updated[existingIdx].studentRollNo
                        };
                        return updated;
                    }
                    return [{ ...data, count: 1, timestamp: new Date() }, ...prev].slice(0, 50);
                });

                setStats(prev => ({ ...prev, totalViolations: prev.totalViolations + 1 }));

                // Update specific session violation count
                setActiveSessions(prev => prev.map(s => {
                    const sId = s.studentId?._id || s.studentId;
                    return sId === data.studentId
                        ? { ...s, violationCount: (s.violationCount || 0) + 1 }
                        : s;
                }));
            }
        };

        const handleSuspension = (data: any) => {
            if (selectedExamId === 'all' || data.examId === selectedExamId) {
                setLiveFeed(prev => [{ ...data, type: 'SUSPENSION', count: 1, message: data.reason, timestamp: new Date() }, ...prev].slice(0, 50));
                setStats(prev => ({ ...prev, totalSuspensions: prev.totalSuspensions + 1 }));

                setActiveSessions(prev => prev.map(s => {
                    const sId = s.studentId?._id || s.studentId;
                    return sId === data.studentId
                        ? { ...s, isSuspended: true }
                        : s;
                }));
            }
        };

        socket.on('monitor-proctor-alert', handleProctorAlert);
        socket.on('student-suspended', handleSuspension);

        return () => {
            socket.off('monitor-proctor-alert', handleProctorAlert);
            socket.off('student-suspended', handleSuspension);
        };
    }, [selectedExamId]);

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

        return Object.values(grouped).filter((v: any) =>
            v.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.studentId?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.examId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a: any, b: any) => new Date(b.lastDetected).getTime() - new Date(a.lastDetected).getTime());
    }, [violations, searchTerm]);

    const handleExportDefaulters = () => {
        if (violations.length === 0) return;

        // Prepare Forensic CSV Data
        // Includes: Exam, Student Name, Roll No, Group, Violation Type, Count, Last Incident, Status
        const headers = ['Exam Title', 'Student Name', 'Roll Number', 'Email', 'Group/Class', 'Violation Type', 'Incident Message', 'Full Timestamp', 'Current Session Status'];

        const csvRows = violations.map(v => {
            // Find current session status if available
            const session = activeSessions.find(s => (s.studentId?._id || s.studentId) === (v.studentId?._id || v.studentId));
            const status = session ? (session.isSuspended ? 'SUSPENDED' : 'IN-PROGRESS') : 'VETERAN (SESSION CLOSED)';

            return [
                `"${v.examId?.title || 'Unknown'}"`,
                `"${v.studentId?.name || 'N/A'}"`,
                `"${v.studentId?.rollNo || 'N/A'}"`,
                `"${v.studentId?.email || 'N/A'}"`,
                `"${(v.studentId?.groupId?.name || v.studentId?.groupId) || 'N/A'}"`,
                `"${v.type}"`,
                `"${v.message.replace(/"/g, '""')}"`, // Escape quotes
                `"${new Date(v.timestamp).toLocaleString()}"`,
                `"${status}"`
            ];
        });

        // Add UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const csvContent = headers.join(',') + '\n' + csvRows.map(row => row.join(',')).join('\n');
        const csvString = BOM + csvContent;

        // Use a more specific MIME type for CSV
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Simple, clean filename for Windows compatibility
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
        link.setAttribute("download", `Audit_Repository_Report_${dateStr}_${timeStr}.csv`);

        document.body.appendChild(link);
        link.click();

        // Cleanup with delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
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
                        <Activity className="h-4 w-4 inline mr-2" /> MONITOR
                    </button>
                    <button onClick={() => setView('reports')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'reports' ? 'bg-primary text-white shadow-lg scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
                        <BarChart2 className="h-4 w-4 inline mr-2" /> AUDIT LOGS
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
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Scope Filter</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary transition-all appearance-none"
                            >
                                <option value="all">Global (All Active Exams)</option>
                                {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                            </select>
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
                            {/* Incident Flow */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
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
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Session Monitor */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Candidate Monitor</h3>
                                    <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">{activeSessions.length} ONLINE</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] thin-scrollbar">
                                    {activeSessions.map((session, i) => (
                                        <CandidateCard key={i} session={session} />
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
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Audit Repository</h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Search and export historically logged violations</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, roll, or exam..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-all shadow-sm dark:text-slate-100"
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleExportDefaulters} className="rounded-xl shadow-lg shrink-0 h-10 px-6 font-black uppercase text-xs tracking-widest">
                                        <Download className="h-4 w-4 mr-2" /> EXPORT
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
                                                    {new Date(v.lastDetected).toLocaleString()}
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
                                                            <span className="text-[10px] font-black uppercase tracking-tight">View Details</span>
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

function StatCard({ label, value, icon: Icon, color }: any) {
    const variants: any = {
        blue: 'bg-blue-600 shadow-blue-200',
        orange: 'bg-orange-500 shadow-orange-200',
        red: 'bg-red-600 shadow-red-200'
    };
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <h4 className="text-3xl font-black text-slate-900 dark:text-slate-100 line-clamp-1">{value}</h4>
            </div>
            <div className={`p-4 rounded-2xl text-white shadow-xl ${variants[color]}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
}

function CandidateCard({ session }: any) {
    const studentName = session.studentId?.name || "Unknown";
    const rollNo = session.studentId?.rollNo || "N/A";

    return (
        <div className={`group bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden ${session.isSuspended ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 shadow-inner ${session.isSuspended ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 'bg-slate-50 dark:bg-slate-800 text-primary dark:text-blue-400'}`}>
                        {studentName.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-tight tracking-tight uppercase line-clamp-1">{studentName}</h4>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1 inline-block border border-slate-100 dark:border-slate-800/40">RNO: {rollNo}</span>
                    </div>
                </div>
                {session.isSuspended ? (
                    <span className="animate-pulse bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black shadow-lg">SUSPENDED</span>
                ) : (
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/80">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Incidents</span>
                    <span className={`text-sm font-black flex items-center gap-1.5 ${session.violationCount > 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
                        {session.violationCount > 0 && <AlertTriangle className="h-3.5 w-3.5" />}
                        {session.violationCount || 0}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Exam Scope</span>
                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl truncate max-w-[120px] text-right border border-slate-100 dark:border-slate-800/40">{session.examId?.title}</span>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, title, text }: any) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                <Icon className="h-10 w-10 text-slate-400 dark:text-slate-600" />
            </div>
            <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-widest">{title}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[180px] mt-2 font-medium">{text}</p>
        </div>
    );
}
