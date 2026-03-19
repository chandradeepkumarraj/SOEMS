import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, Users, FileText, BarChart3, Search, Calendar, Trash2, Pencil, Download, StopCircle, Copy, RotateCcw, Timer } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getExams, getTeacherDashboardStats, deleteExam, endExam, resetExam } from '../services/examService';
import { getResultsByExam } from '../services/resultService';
import { getAIStatus } from '../services/aiService';
import { Sparkles, Cpu, Globe } from 'lucide-react';

export default function TeacherDashboard() {
    const { user } = useOutletContext<any>() || {};
    const [exams, setExams] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<any>({
        totalStudents: 0,
        avgScore: 0,
        totalExams: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [resettingId, setResettingId] = useState<string | null>(null);
    const [aiStatus, setAiStatus] = useState<{ provider: string; model: string } | null>(null);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            try {
                await deleteExam(id);
                setExams(exams.filter(exam => exam._id !== id));
            } catch (error) {
                console.error('Failed to delete exam:', error);
                alert('Failed to delete exam. Please try again.');
            }
        }
    };

    const handleDownloadReport = async (examId: string, title: string) => {
        try {
            const results = await getResultsByExam(examId);
            if (!results || results.length === 0) {
                alert('No results available to download.');
                return;
            }

            const headers = ['Student Name', 'Email', 'Score', 'Total Points', 'Submitted At'];
            const rows = results.map((r: any) => [
                `"${r.studentId?.name || 'Unknown'}"`,
                `"${r.studentId?.email || 'Unknown'}"`,
                r.score,
                r.totalPoints,
                `"${new Date(r.submittedAt).toLocaleString()}"`
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/\s+/g, '_')}_Report.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Failed to download report. Please try again.');
        }
    };


    const handleEndExam = async (examId: string) => {
        if (!window.confirm('Are you sure you want to end this exam now? No student will be able to join after this.')) return;
        try {
            await endExam(examId);
            alert('Exam ended successfully');
            const data = await getExams();
            setExams(data);
        } catch (error) {
            console.error('Failed to end exam:', error);
            alert('Failed to end exam');
        }
    };

    const handleResetExam = async (examId: string, title: string) => {
        const exam = exams.find(e => e._id === examId);
        const isAdaptive = exam?.isAdaptive || false;

        let regenerateQuestions = false;
        if (isAdaptive) {
            const choice = window.confirm(
                `⚠️ RESET ADAPTIVE EXAM: "${title}"\n\nThis will wipe all student data. \n\nDo you also want to REGENERATE a fresh AI Question Pool? \n\nClick "OK" to generate new questions.\nClick "Cancel" to keep the existing pool.`
            );
            regenerateQuestions = choice;
        } else {
            if (!window.confirm(
                `⚠️ RESET EXAM: "${title}"\n\nThis will permanently delete ALL student results, sessions, and violation records for this exam. The exam will be republished for retake.\n\nAre you absolutely sure?`
            )) return;
        }

        try {
            setResettingId(examId);
            const result = await resetExam(examId, regenerateQuestions);
            alert(`✅ Exam reset successfully!\n\nDeleted: ${result.deletedResults} results, ${result.deletedSessions} sessions, ${result.deletedViolations} violations.${regenerateQuestions ? '\n\nAI is now generating a fresh question pool in the background.' : ''}\n\nNOTE: The exam is scheduled to go live in 2 minutes for system readiness.`);
            const data = await getExams();
            setExams(data);
        } catch (error: any) {
            console.error('Failed to reset exam:', error);
            alert(error.response?.data?.message || 'Failed to reset exam. Please try again.');
        } finally {
            setResettingId(null);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsData, statsData] = await Promise.all([
                    getExams(),
                    getTeacherDashboardStats()
                ]);
                setExams(examsData);
                setDashboardStats(statsData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        const fetchAIStatus = async () => {
            try {
                const status = await getAIStatus();
                setAiStatus(status);
            } catch (error) {
                console.error('Failed to fetch AI status:', error);
            }
        };
        fetchData();
        fetchAIStatus();
    }, []);

    const stats = [
        { label: 'Total Exams', value: dashboardStats.totalExams.toString(), icon: FileText, color: 'bg-blue-500' },
        { label: 'Total Students', value: dashboardStats.totalStudents.toString(), icon: Users, color: 'bg-emerald-500' },
        { label: 'Avg. Score', value: `${dashboardStats.avgScore}%`, icon: BarChart3, color: 'bg-purple-500' },
    ];

    return (
        <>
            <div className="mb-8 p-6 bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] flex flex-col md:flex-row items-center md:items-start justify-between gap-4 transition-all duration-300">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 dark:border-slate-800 bg-gray-200 dark:bg-slate-800"
                        />
                        <Link to="/teacher/profile" className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-800 rounded-full shadow border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" title="Edit Photo">
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{user?.name || 'Welcome, Teacher'}</h1>
                        <p className="text-slate-900 dark:text-slate-400 font-bold italic">{user?.email}</p>
                        {user?.bio && (
                            <div className="mt-2 text-sm text-slate-900 dark:text-slate-300 font-bold bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800 inline-block">
                                <span className="font-black mr-2 uppercase tracking-widest text-[10px] text-blue-600 dark:text-blue-400">Staff Bio:</span>
                                {user.bio}
                            </div>
                        )}
                        {aiStatus && (
                            <div className="mt-3 flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${aiStatus.provider === 'openai' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                                        aiStatus.provider === 'gemini' ? 'bg-red-100 text-red-600 border-red-200' :
                                            'bg-emerald-100 text-emerald-600 border-emerald-200'
                                    } shadow-sm`}>
                                    {aiStatus.provider === 'openai' ? <Globe className="h-3 w-3" /> :
                                        aiStatus.provider === 'gemini' ? <Sparkles className="h-3 w-3" /> :
                                            <Cpu className="h-3 w-3" />}
                                    AI Provider: {aiStatus.provider} ({aiStatus.model})
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic animate-pulse">Running Optimized</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 sm:flex-initial"
                    >
                        <Link to="/teacher/create-exam" className="block">
                            <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white shadow-lg shadow-primary/25 border-none h-14 px-8 text-lg font-black tracking-tight group overflow-hidden relative">
                                <Plus className="mr-3 h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                                <span className="relative z-10">Create New Exam</span>
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[var(--card-bg)] p-6 rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-slate-900 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">{stat.label}</h3>
                                <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-20 text-${stat.color.replace('bg-', '')}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Exams */}
            <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] overflow-hidden transition-all duration-300">
                <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Recent Exams</h2>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border-2 border-slate-300 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 font-bold text-slate-900 dark:text-slate-100 dark:bg-slate-950 transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-main)] text-[var(--text-main)] text-[10px] font-black uppercase tracking-widest border-b-2 border-[var(--border-main)]">
                            <tr>
                                <th className="px-6 py-4">Exam Identification</th>
                                <th className="px-6 py-4">Scheduled Date</th>
                                <th className="px-6 py-4">System Status</th>
                                <th className="px-6 py-4">Candidate Flow</th>
                                <th className="px-6 py-4 text-right">Control Console</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-slate-500">
                                        Loading exams...
                                    </td>
                                </tr>
                            ) : exams.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-slate-500">
                                        No exams found. Create your first exam!
                                    </td>
                                </tr>
                            ) : (
                                exams.filter(exam => exam.title.toLowerCase().includes(searchQuery.toLowerCase())).map((exam) => (
                                    <tr key={exam._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{exam.title}</div>
                                            <div className="text-[10px] font-mono font-black text-slate-900/60 dark:text-slate-500 uppercase tracking-widest">ID: {exam._id.slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-300 font-bold text-xs uppercase tracking-tight">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                {new Date(exam.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${exam.status === 'published'
                                                ? 'bg-success/10 text-success border-success/30 shadow-sm shadow-success/10' :
                                                exam.status === 'draft' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200' :
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200'
                                                }`}>
                                                {exam.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">
                                            {exam.candidatesCount || 0} Candidates
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {exam.status === 'published' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEndExam(exam._id)}
                                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-900 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                                                            title="Stop Exam Manually"
                                                        >
                                                            <StopCircle className="h-4 w-4" />
                                                        </button>
                                                        {exam.autoCompleteAt && (
                                                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800" title={`Auto-closes at ${new Date(exam.autoCompleteAt).toLocaleString()}`}>
                                                                <Timer className="h-3 w-3" />
                                                                {new Date(exam.autoCompleteAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {(exam.status === 'closed' || exam.status === 'archived') && (
                                                    <button
                                                        onClick={() => handleResetExam(exam._id, exam.title)}
                                                        disabled={resettingId === exam._id}
                                                        className={`p-2 rounded-lg transition-colors ${resettingId === exam._id
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                            : 'text-slate-900 dark:text-slate-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:text-cyan-700 dark:hover:text-cyan-400'
                                                            }`}
                                                        title={resettingId === exam._id ? "Resetting..." : "Reset Exam for Re-take"}
                                                    >
                                                        <RotateCcw className={`h-4 w-4 ${resettingId === exam._id ? 'animate-spin' : ''}`} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadReport(exam._id, exam.title)}
                                                    className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-slate-900 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                                                    title="Download Report"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <Link to={`/teacher/analytics/${exam._id}`}>
                                                    <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-slate-900 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors" title="Analytics">
                                                        <BarChart3 className="h-4 w-4" />
                                                    </button>
                                                </Link>
                                                <Link to={`/teacher/create-exam?edit=${exam._id}`}>
                                                    <button className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-slate-900 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors" title="Edit">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                </Link>
                                                <Link to={`/teacher/create-exam?clone=${exam._id}`}>
                                                    <button className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg text-slate-900 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-400 transition-colors" title="Clone as New Version">
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={(e) => handleDelete(exam._id, e)}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-900 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
