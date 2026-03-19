import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getMyResults } from '../services/resultService';
import { BookOpen, Clock, Trophy, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import TrophyRoom from '../components/dashboard/TrophyRoom';
import PerformanceMentor from '../components/dashboard/PerformanceMentor';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

import PhysiologyShield from '../components/dashboard/PhysiologyShield';

export default function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useOutletContext<any>() || {};
    const [stats, setStats] = useState({
        completed: 0,
        avgScore: 0,
        upcoming: 0
    });
    const [nextExam, setNextExam] = useState<any>(null);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    const calculateGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        setGreeting(calculateGreeting());
        
        const timer = setInterval(() => {
            setGreeting(calculateGreeting());
        }, 60000); // Check every minute

        return () => clearInterval(timer);
    }, []);

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
                setResults(safeResults.reverse()); // Chronological order

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


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
                        {greeting}, {user?.name?.split(' ')[0] || t('dashboard.student')}! 🚀
                    </h1>
                    <p className="text-blue-100 text-lg max-w-xl">
                        {t('dashboard.quote', '"Success is the sum of small efforts, repeated day in and day out."')}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <Button
                            className="bg-white text-blue-600 hover:bg-blue-50 border-none"
                            onClick={() => navigate('/student/exams')}
                        >
                            {t('dashboard.find_exams', 'Find Exams')}
                        </Button>
                        <Button
                            variant="outline"
                            className="text-white border-white hover:bg-white/10 hover:text-white"
                            onClick={() => navigate('/student/results')}
                        >
                            {t('dashboard.view_progress', 'View Progress')}
                        </Button>
                    </div>
                </div>
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
            </motion.div>

            {/* AI Evolution: Trophy Room */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <TrophyRoom />
            </motion.div>

            {/* Consolidated Summary Section for Students */}
            {user?.role === 'student' && (
                <div className="space-y-6">
                    {/* Student Identity Bar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-main)] shadow-sm flex flex-wrap items-center gap-6"
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-slate-500 uppercase font-black text-[10px] tracking-widest">Roll No:</span>
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800">{user.rollNo || 'N/A'}</span>
                        </div>
                        {user.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-slate-500 uppercase font-black text-[10px] tracking-widest">Phone:</span>
                                <span className="font-bold text-gray-900 dark:text-slate-100">{user.phoneNumber}</span>
                            </div>
                        )}
                        {user.group && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-slate-500 uppercase font-black text-[10px] tracking-widest">Group:</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">{user.group.name}</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Physiology Enhancements */}
                    <PhysiologyShield avgScore={stats.avgScore} />

                    {/* Stats & Next Up Combined Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stats - Left Col (Span 2) */}
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard
                                label={t('dashboard.stats.completed')}
                                value={stats.completed}
                                icon={BookOpen}
                                color="text-blue-600"
                                bg="bg-blue-50"
                                trend={t('dashboard.stats.trend_week')}
                            />
                            <StatCard
                                label={t('dashboard.stats.avg_score')}
                                value={`${stats.avgScore}%`}
                                icon={Trophy}
                                color="text-yellow-600"
                                bg="bg-yellow-50"
                                trend={t('dashboard.stats.trend_top')}
                            />
                            <div className="sm:col-span-2">
                                <StatCard
                                    label={t('dashboard.stats.upcoming')}
                                    value={stats.upcoming}
                                    icon={Target}
                                    color="text-purple-600"
                                    bg="bg-purple-50"
                                    trend={t('dashboard.stats.trend_days')}
                                />
                            </div>
                        </div>

                        {/* Next Up - Right Col (Span 1) */}
                        <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border-main)] p-6 flex flex-col h-full relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Clock className="h-16 w-16 text-primary" />
                            </div>

                            <h2 className="text-sm font-black text-[var(--text-main)] mb-4 flex items-center gap-2 uppercase tracking-widest opacity-60">
                                {t('dashboard.up_next')}
                            </h2>

                            {loading ? (
                                <div className="flex-1 bg-gray-50 dark:bg-slate-800 rounded-lg animate-pulse" />
                            ) : nextExam ? (
                                <div className="flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-primary mb-1 uppercase tracking-tighter">Recommended Focus</p>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{nextExam.title}</h3>
                                    </div>

                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest">{t('exam.date')}</span>
                                            <span className="font-black text-slate-700 dark:text-slate-200">{new Date(nextExam.startTime).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest">{t('exam.time')}</span>
                                            <span className="font-black text-slate-700 dark:text-slate-200">{new Date(nextExam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] transition-transform font-black uppercase text-[10px] tracking-[0.2em] h-12"
                                        onClick={() => navigate(`/exam/${nextExam._id}`)}
                                    >
                                        {t('dashboard.go_to_hall')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-400 mb-4 tracking-tight">{t('dashboard.no_exams')}</p>
                                    <Button
                                        variant="outline"
                                        className="w-full font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all"
                                        onClick={() => navigate('/student/exams')}
                                    >
                                        Browse All Exams
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Performance Mentor & Score Journey */}
            {user?.role === 'student' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    <PerformanceMentor />
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-[var(--card-bg)] p-8 rounded-3xl shadow-[var(--shadow-main)] border border-[var(--border-main)]"
                    >
                        <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" /> {t('dashboard.score_journey')}
                        </h2>
                        {results.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={results.map((r, i) => ({
                                        name: t('dashboard.exam_n', { n: i + 1 }),
                                        score: Math.round((r.score / r.totalPoints) * 100)
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="name" hide />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val) => [`${val}%`, t('dashboard.score', 'Score')]}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#6366f1"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-[var(--border-main)] rounded-2xl">
                                <p className="text-[var(--text-muted)] italic font-bold tracking-tight">{t('dashboard.complete_to_see')}</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg, trend }: any) {
    return (
        <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${bg} dark:bg-slate-800/50 ${color} dark:text-blue-400`}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && <span className="text-xs font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">{trend}</span>}
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</h3>
            </div>
        </div>
    );
}
