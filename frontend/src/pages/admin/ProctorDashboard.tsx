import { useState, useEffect, useMemo } from 'react';
import {
    ShieldAlert, Users, Activity, Filter, BarChart2,
    Download, Search, AlertTriangle,
    UserX, Clock, ExternalLink, Camera, MessageSquare
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getExams, getExamViolations, getActiveSessions, getGlobalProctorStats, resumeStudentSession } from '../../services/examService';
import { getSocket } from '../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from '../../components/proctor/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import { CandidateCard } from '../../components/proctor/CandidateCard';

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
    const [examSearch, setExamSearch] = useState('');

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

    const activeExamIds = useMemo(() => {
        const now = new Date();
        return exams
            .filter(e => e.status === 'published' && new Date(e.endTime) > now)
            .map(e => e._id);
    }, [exams]);

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

        const handleProctorAlert = (data: any) => {
            // Requirement: If Global view is selected, ONLY show violations of current ongoing exams
            const isOngoing = activeExamIds.includes(data.examId);
            if (selectedExamId === 'all' && !isOngoing) return;

            if (selectedExamId === 'all' || data.examId === selectedExamId) {
                setLiveFeed(prev => [{ ...data, timestamp: new Date() }, ...prev].slice(0, 50));
                setStats(prev => ({ ...prev, totalViolations: prev.totalViolations + 1 }));

                // Update specific session violation count if in-memory
                setActiveSessions(prev => prev.map(s =>
                    s.studentId._id === data.studentId
                        ? { ...s, violationCount: (s.violationCount || 0) + 1 }
                        : s
                ));
            }
        };

        const handleSuspension = (data: any) => {
            const isOngoing = activeExamIds.includes(data.examId);
            if (selectedExamId === 'all' && !isOngoing) return;

            if (selectedExamId === 'all' || data.examId === selectedExamId) {
                setLiveFeed(prev => [{ ...data, type: 'SUSPENSION', message: data.reason, timestamp: new Date() }, ...prev].slice(0, 50));
                setStats(prev => ({ ...prev, totalSuspensions: prev.totalSuspensions + 1 }));

                setActiveSessions(prev => prev.map(s =>
                    s.studentId._id === data.studentId
                        ? { ...s, isSuspended: true }
                        : s
                ));
            }
        };

        socket.on('monitor-proctor-alert', handleProctorAlert);
        socket.on('student-suspended', handleSuspension);

        return () => {
            socket.off('monitor-proctor-alert', handleProctorAlert);
            socket.off('student-suspended', handleSuspension);
        };
    }, [selectedExamId]);

    const filteredViolations = useMemo(() => {
        return violations.filter(v => {
            // Requirement: If 'Global' is selected then only show violations of current ongoing exams
            if (selectedExamId === 'all') {
                const examId = v.examId?._id || v.examId;
                if (!activeExamIds.includes(examId)) return false;
            }

            const studentName = v.studentId?.name || '';
            const studentRoll = v.studentId?.rollNo || '';
            const violationType = v.type || '';
            const examTitle = v.examId?.title || '';
            const search = searchTerm.toLowerCase();

            return studentName.toLowerCase().includes(search) ||
                studentRoll.toLowerCase().includes(search) ||
                violationType.toLowerCase().includes(search) ||
                examTitle.toLowerCase().includes(search);
        });
    }, [violations, searchTerm, activeExamIds, selectedExamId]);

    const handleResume = async (examId: string, studentId: string) => {
        try {
            await resumeStudentSession(examId, studentId);
            setActiveSessions(prev => prev.map(s =>
                s.studentId._id === studentId
                    ? { ...s, isSuspended: false }
                    : s
            ));
            alert('Session resumed successfully.');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to resume session');
        }
    };

    const handleExportDefaulters = () => {
        if (violations.length === 0) return;
        const headers = ['Exam', 'Name', 'Roll Number', 'Email', 'Group', 'Violation', 'Message', 'Time'];
        const csvRows = violations.map(v => [
            v.examId?.title || 'Unknown',
            v.studentId?.name || 'N/A', v.studentId?.rollNo || 'N/A', v.studentId?.email || 'N/A',
            v.studentId?.groupId?.name || 'N/A', v.type, v.message.replace(/,/g, ';'),
            new Date(v.timestamp).toLocaleString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + csvRows.map(row => row.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Defaulters_${new Date().toLocaleDateString()}.csv`);
        link.click();
    };

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 bg-slate-50 min-h-screen">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                        <ShieldAlert className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            PROCTOR COMMAND <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse uppercase">Live</span>
                        </h1>
                        <p className="text-slate-900 dark:text-slate-100 font-bold italic text-sm">Real-time Session Auditing & Compliance Control</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button onClick={() => setView('monitor')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'monitor' ? 'bg-primary text-white shadow-lg scale-105' : 'text-slate-600 hover:bg-white'}`}>
                        <Activity className="h-4 w-4 inline mr-2" /> MONITOR
                    </button>
                    <button onClick={() => setView('reports')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'reports' ? 'bg-primary text-white shadow-lg scale-105' : 'text-slate-600 hover:bg-white'}`}>
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
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200">
                        <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest block mb-2">Scope Filter</label>
                        <div className="space-y-3">
                            <div className="relative group/search">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 dark:text-slate-400 pointer-events-none group-focus-within/search:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search Exam Name..."
                                    value={examSearch}
                                    onChange={(e) => setExamSearch(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div className="relative group/filter">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 dark:text-slate-400 pointer-events-none group-focus-within/filter:text-primary transition-colors" />
                                <select
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter"
                                >
                                    <option value="all">Global (All Active Exams)</option>
                                    {ongoingExams.length > 0 && (
                                        <optgroup label="Published Exams (Ongoing)">
                                            {ongoingExams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                                        </optgroup>
                                    )}
                                    {historicalExams.length > 0 && (
                                        <optgroup label="Historical/Ended Exams">
                                            {historicalExams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
                            {/* Incident Flow */}
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Incident Stream</h3>
                                    <span className="animate-pulse flex items-center gap-1 text-[10px] font-black text-red-500">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" /> LIVE
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
                                    <AnimatePresence>
                                        {liveFeed.length === 0 ? (
                                            <EmptyState icon={Clock} title="Monitoring Secures" text="Waiting for live telemetry from active candidate sessions." />
                                        ) : (
                                            liveFeed.map((alert, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${alert.type === 'SUSPENSION' ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-slate-50 shadow-sm'}`}
                                                >
                                                    <div className={`p-3 rounded-xl shrink-0 ${alert.type === 'SUSPENSION' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                                        <ShieldAlert className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{alert.type}</span>
                                                            <span className="text-[10px] font-mono font-bold text-slate-300">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                        <p className="font-black text-slate-900 text-sm">{alert.studentName}</p>
                                                        <p className="text-[10px] text-slate-900 dark:text-slate-100 mt-1 italic font-bold leading-relaxed truncate">"{alert.message}"</p>
                                                        {/* Evidence Snapshot */}
                                                        {alert.snapshot && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <Camera className="h-3 w-3 text-blue-500 shrink-0" />
                                                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Evidence</span>
                                                                <img
                                                                    src={alert.snapshot}
                                                                    alt="Violation snapshot"
                                                                    className="h-12 w-16 object-cover rounded-lg border-2 border-blue-500/30 shadow-md cursor-pointer hover:scale-150 transition-transform origin-left"
                                                                />
                                                            </div>
                                                        )}
                                                        {/* Voice Transcript Evidence */}
                                                        {alert.transcript && (
                                                            <div className="mt-2 flex items-start gap-2 bg-amber-50 rounded-lg p-2 border border-amber-200/50">
                                                                <MessageSquare className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block">Voice Transcript</span>
                                                                    <p className="text-[10px] text-amber-700 font-medium italic leading-relaxed">"{alert.transcript}"</p>
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
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Candidate Monitor</h3>
                                    <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">{activeSessions.length} ONLINE</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px]">
                                    {activeSessions.map((session, i) => (
                                        <CandidateCard key={i} session={session} onResume={handleResume} />
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
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/20">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Event Logs</h3>
                                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Search and export historically logged violations</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, roll, or exam..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-all shadow-sm"
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleExportDefaulters} className="rounded-xl shadow-lg shrink-0 h-10 px-6 font-black uppercase text-xs tracking-widest">
                                        <Download className="h-4 w-4 mr-2" /> EXPORT
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-200 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest border-b-2 border-slate-300 dark:border-slate-700">
                                            <th className="px-6 py-4">Examination</th>
                                            <th className="px-6 py-4">Candidate Identity</th>
                                            <th className="px-6 py-4">Violation Type</th>
                                            <th className="px-6 py-4">Logged At</th>
                                            <th className="px-6 py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredViolations.map((v, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-1 rounded max-w-[150px] inline-block truncate">{v.examId?.title}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-slate-900 text-sm">{v.studentId?.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-900 dark:text-white font-black uppercase tracking-tight">ROLL: {v.studentId?.rollNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${v.type === 'SUSPENSION' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                                        {v.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-mono text-slate-900 dark:text-white font-black uppercase tracking-tighter">
                                                    {new Date(v.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-900 dark:text-white transition-all">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </button>
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
        </div>
    );
}
