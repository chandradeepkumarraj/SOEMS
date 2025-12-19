import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getMyResults } from '../services/resultService';
import { BookOpen, Clock, Trophy, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useOutletContext<any>() || {};
    const [stats, setStats] = useState({
        completed: 0,
        avgScore: 0,
        upcoming: 0
    });
    const [nextExam, setNextExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsData, resultsData] = await Promise.all([
                    getExams(),
                    getMyResults()
                ]);

                // Safety checks in case API returns unexpected structure
                const safeExams = Array.isArray(examsData) ? examsData : [];
                const safeResults = Array.isArray(resultsData) ? resultsData : [];

                const publishedExams = safeExams.filter((e: any) => e.status === 'published');
                const futureExams = publishedExams.filter((e: any) => new Date(e.startTime) > new Date());
                // Find the nearest upcoming exam
                const nearest = futureExams.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

                const avg = safeResults.length > 0
                    ? Math.round(safeResults.reduce((acc: number, r: any) => acc + (r.score / r.totalPoints) * 100, 0) / safeResults.length)
                    : 0;

                setStats({
                    completed: safeResults.length,
                    avgScore: avg,
                    upcoming: futureExams.length
                });
                setNextExam(nearest);

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden"
            >
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}! 🚀
                    </h1>
                    <p className="text-blue-100 text-lg max-w-xl">
                        "Success is the sum of small efforts, repeated day in and day out."
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <Button
                            className="bg-white text-blue-600 hover:bg-blue-50 border-none"
                            onClick={() => navigate('/student/exams')}
                        >
                            Find Exams
                        </Button>
                        <Button
                            variant="outline"
                            className="text-white border-white hover:bg-white/10 hover:text-white"
                            onClick={() => navigate('/student/results')}
                        >
                            View Progress
                        </Button>
                    </div>
                </div>
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
            </motion.div>

            {/* Student Info Card (Quick Verify) */}
            {user?.role === 'student' && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-wrap items-center gap-6"
                >
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Roll No:</span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{user.rollNo || 'N/A'}</span>
                    </div>
                    {user.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Phone:</span>
                            <span className="font-bold text-gray-900">{user.phoneNumber}</span>
                        </div>
                    )}
                    {user.group && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Group:</span>
                            <span className="font-bold text-gray-900">{user.group.name}</span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Exams Completed"
                    value={stats.completed}
                    icon={BookOpen}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    trend="+2 this week"
                />
                <StatCard
                    label="Average Score"
                    value={`${stats.avgScore}%`}
                    icon={Trophy}
                    color="text-yellow-600"
                    bg="bg-yellow-50"
                    trend="Top 15%"
                />
                <StatCard
                    label="Upcoming Exams"
                    value={stats.upcoming}
                    icon={Target}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    trend="Next in 2 days"
                />
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Next Up Section - Now Full Width */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" /> Up Next
                    </h2>
                    {loading ? (
                        <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
                    ) : nextExam ? (
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white relative overflow-hidden group">
                            <div className="relative z-10 w-full max-w-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Upcoming Exam</p>
                                        <h3 className="text-xl font-bold">{nextExam.title}</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-sm">
                                        <span className="block text-gray-400">Duration</span>
                                        <span className="font-medium">{nextExam.duration} mins</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="block text-gray-400">Date</span>
                                        <span className="font-medium">{new Date(nextExam.startTime).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="block text-gray-400">Time</span>
                                        <span className="font-medium">{new Date(nextExam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <Button
                                    className="bg-white text-gray-900 hover:bg-gray-100"
                                    onClick={() => navigate(`/exam/${nextExam._id}`)}
                                >
                                    Go to Exam Hall
                                </Button>
                            </div>
                            {/* Decorative Icon */}
                            <div className="absolute right-0 bottom-0 p-6 opacity-10 transform scale-150">
                                <Clock className="h-32 w-32 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p>No upcoming exams scheduled.</p>
                            <Button variant="ghost" className="mt-2 text-primary" onClick={() => navigate('/student/exams')}>
                                Browse All Exams
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg, trend }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${bg} ${color}`}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
}
