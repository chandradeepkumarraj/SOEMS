import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExams, deleteExam, endExam } from '../services/examService';
import { getResultsByExam } from '../services/resultService';
import { BarChart3, Pencil, Trash2, Download, Search, StopCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function MyExams() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const data = await getExams();
                setExams(data);
            } catch (error) {
                console.error('Failed to fetch exams:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            try {
                await deleteExam(id);
                setExams(exams.filter(exam => exam._id !== id));
            } catch (error) {
                console.error('Failed to delete exam:', error);
                alert('Failed to delete exam.');
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

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
                    <p className="text-gray-500">Manage your exams and view reports.</p>
                </div>
                <Link to="/teacher/create-exam">
                    <Button>
                        Create New Exam
                    </Button>
                </Link>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">All Exams</h2>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredExams.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No exams found.</td></tr>
                            ) : (
                                filteredExams.map((exam) => (
                                    <tr key={exam._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{exam.title}</div>
                                            <div className="text-xs text-gray-500">ID: #{exam._id.slice(-4)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(exam.startTime).toLocaleDateString()}
                                            <br />
                                            <span className="text-xs">{new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${exam.status === 'published' ? 'bg-green-100 text-green-800' :
                                                    exam.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {exam.status}
                                            </span>
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
                                                    onClick={() => handleDelete(exam._id)}
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
