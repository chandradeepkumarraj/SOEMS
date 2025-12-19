import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, Users, FileText, BarChart3, Search, Calendar, Trash2, Pencil, Download, StopCircle } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getExams, getTeacherDashboardStats, deleteExam, endExam } from '../services/examService';
import { getResultsByExam } from '../services/resultService';

export default function TeacherDashboard() {
    const { user } = useOutletContext<any>() || {};
    const [exams, setExams] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<any>({
        totalStudents: 0,
        avgScore: 0,
        totalExams: 0
    });
    const [loading, setLoading] = useState(true);

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
        fetchData();
    }, []);

    const stats = [
        { label: 'Total Exams', value: dashboardStats.totalExams.toString(), icon: FileText, color: 'bg-blue-500' },
        { label: 'Total Students', value: dashboardStats.totalStudents.toString(), icon: Users, color: 'bg-emerald-500' },
        { label: 'Avg. Score', value: `${dashboardStats.avgScore}%`, icon: BarChart3, color: 'bg-purple-500' },
    ];

    return (
        <>
            <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 bg-gray-200"
                        />
                        <Link to="/teacher/profile" className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow border border-gray-100 hover:bg-gray-50 text-gray-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" title="Edit Photo">
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Welcome, Teacher'}</h1>
                        <p className="text-gray-500">{user?.email}</p>
                        {user?.bio && (
                            <div className="mt-2 text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded inline-block">
                                <span className="font-semibold mr-2">Bio:</span>
                                {user.bio}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link to="/teacher/create-exam">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Exam
                        </Button>
                    </Link>
                    <Link to="/teacher/profile">
                        <Button variant="outline">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    </Link>
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

            {/* Recent Exams */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Recent Exams</h2>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="px-6 py-4 font-medium">Exam Title</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Candidates</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading exams...
                                    </td>
                                </tr>
                            ) : exams.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No exams found. Create your first exam!
                                    </td>
                                </tr>
                            ) : (
                                exams.map((exam) => (
                                    <tr key={exam._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{exam.title}</div>
                                            <div className="text-xs text-gray-500">ID: #{exam._id.slice(-4)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(exam.startTime).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${exam.status === 'published' ? 'bg-green-100 text-green-800' :
                                                exam.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {exam.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {exam.candidatesCount || 0} Candidates
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {exam.status === 'published' && (
                                                    <button
                                                        onClick={() => handleEndExam(exam._id)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-error"
                                                        title="Stop Exam Manually"
                                                    >
                                                        <StopCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadReport(exam._id, exam.title)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600"
                                                    title="Download Report"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <Link to={`/teacher/analytics/${exam._id}`}>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary" title="Analytics">
                                                        <BarChart3 className="h-4 w-4" />
                                                    </button>
                                                </Link>
                                                <Link to={`/teacher/create-exam?edit=${exam._id}`}>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600" title="Edit">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={(e) => handleDelete(exam._id, e)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
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
