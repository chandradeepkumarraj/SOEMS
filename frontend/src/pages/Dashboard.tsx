import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    User,
    LogOut,
    Bell,
    Search,
    Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getMyResults } from '../services/resultService';

export default function Dashboard() {
    const navigate = useNavigate();
    const [exams, setExams] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsData, resultsData] = await Promise.all([
                    getExams(),
                    getMyResults()
                ]);

                // Filter for published exams only
                const publishedExams = examsData.filter((exam: any) => exam.status === 'published');
                setExams(publishedExams);
                setResults(resultsData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <span className="text-2xl font-bold text-primary">SOEMS</span>
                </div>

                <nav className="p-4 space-y-1">
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-primary bg-blue-50 rounded-lg font-medium">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link to="/exams" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                        <FileText className="h-5 w-5" />
                        My Exams
                    </Link>
                    <Link to="/results" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                        <BookOpen className="h-5 w-5" />
                        Results
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                        <User className="h-5 w-5" />
                        Profile
                    </Link>
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-error hover:bg-red-50 w-full rounded-lg font-medium transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4 w-96">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search exams..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-error rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">Student</p>
                                <p className="text-xs text-gray-500">View</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                ST
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                        <p className="text-gray-600">View and take your assigned exams.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 font-medium">Available Exams</h3>
                                <span className="p-2 bg-blue-50 text-primary rounded-lg">
                                    <FileText className="h-5 w-5" />
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{exams.length}</p>
                            <p className="text-sm text-gray-500 mt-1">Ready to take</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 font-medium">Completed</h3>
                                <span className="p-2 bg-green-50 text-success rounded-lg">
                                    <BookOpen className="h-5 w-5" />
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{results.length}</p>
                            <p className="text-sm text-gray-500 mt-1">Exams finished</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 font-medium">Avg Score</h3>
                                <span className="p-2 bg-yellow-50 text-warning rounded-lg">
                                    <Clock className="h-5 w-5" />
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">
                                {results.length > 0
                                    ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalPoints) * 100, 0) / results.length) + '%'
                                    : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Overall Performance</p>
                        </div>
                    </div>

                    {/* Available Exams List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Available Exams</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">Loading exams...</div>
                            ) : exams.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">No exams available at the moment.</div>
                            ) : (
                                exams.map((exam) => (
                                    <div key={exam._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary font-bold text-lg">
                                                {exam.title.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(exam.startTime).toLocaleDateString()} • {exam.duration} mins
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => navigate(`/exam/${exam._id}`)}>Start Exam</Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
