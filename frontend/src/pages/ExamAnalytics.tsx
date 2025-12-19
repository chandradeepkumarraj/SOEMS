import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Clock, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, StopCircle, Trophy, Target, Zap, TrendingUp, BarChart3, Medal, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getExamAnalytics, endExam } from '../services/examService';

export default function ExamAnalytics() {
    const { examId } = useParams<{ examId: string }>();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = async (isRefresh = false) => {
        if (!examId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getExamAnalytics(examId);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(() => fetchAnalytics(true), 15000); // Auto-refresh every 15s
        return () => clearInterval(interval);
    }, [examId]);

    const handleEndExam = async () => {
        if (!examId) return;
        if (!window.confirm('Are you sure you want to end this exam now? No student will be able to join after this.')) return;

        try {
            await endExam(examId);
            alert('Exam ended successfully');
            fetchAnalytics();
        } catch (error) {
            console.error('Failed to end exam:', error);
            alert('Failed to end exam');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <AlertCircle className="h-12 w-12 text-error mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics Not Found</h2>
                <p className="text-gray-600 mb-6">We couldn't load the analytics for this exam.</p>
                <Link to="/teacher/exams">
                    <Button variant="primary">Back to Exams</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link to="/teacher/exams" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-2 group">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to My Exams</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900">{analytics.title}</h1>
                            {analytics.status === 'published' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider animate-pulse">
                                    <div className="h-2 w-2 rounded-full bg-green-500" /> Live
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle className="h-3 w-3" /> Closed
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 mt-1">Detailed performance metrics and student insights</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => fetchAnalytics(true)}
                            disabled={refreshing}
                            className="bg-white"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-error hover:bg-red-700"
                            onClick={handleEndExam}
                        >
                            <StopCircle className="h-4 w-4 mr-2" />
                            Stop Exam
                        </Button>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Eligible</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalEligible}</h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center mb-4 text-warning">
                            <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Now</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{analytics.active}</h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 text-success">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{analytics.finished}</h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Not Attended</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{analytics.notAttended}</h3>
                    </motion.div>
                </div>

                {/* Performance Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase">Average Score</p>
                                <h3 className="text-2xl font-bold text-gray-900">{analytics.averageScore?.toFixed(1) || 0}</h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Class Median</p>
                            <p className="text-lg font-bold text-gray-700">{analytics.medianScore?.toFixed(1) || 0}</p>
                        </div>
                    </motion.div>

                    {analytics.topPerformer && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Medal className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-100 uppercase">Top Performer</p>
                                    <h3 className="text-xl font-bold">{analytics.topPerformer.name}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black">{analytics.topPerformer.score}</p>
                                <p className="text-xs text-amber-100">points</p>
                            </div>
                        </motion.div>
                    )}
                </div>
                {/* Advanced Insights Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {analytics.toughestQuestion && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                    <Target className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-red-500 uppercase">Toughest Question</span>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{analytics.toughestQuestion.text}</h4>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-red-600">{Math.round(analytics.toughestQuestion.accuracy)}%</span>
                                    <span className="text-sm text-gray-500 mb-1">accuracy</span>
                                </div>
                            </div>
                            <p className="text-xs text-red-600 mt-4 bg-red-100/50 p-2 rounded-lg">
                                Missed or not attended by {analytics.toughestQuestion.notAttendedCount} students.
                            </p>
                        </motion.div>
                    )}

                    {/* Easiest Question Card */}
                    {analytics.easiestQuestion && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-green-500 uppercase">Easiest Question</span>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{analytics.easiestQuestion.text}</h4>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-green-600">{Math.round(analytics.easiestQuestion.accuracy)}%</span>
                                    <span className="text-sm text-gray-500 mb-1">accuracy</span>
                                </div>
                            </div>
                            <p className="text-xs text-green-600 mt-4 bg-green-100/50 p-2 rounded-lg font-medium">
                                Best performing question in the exam.
                            </p>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-blue-500 uppercase">Quickest Win</span>
                        </div>
                        <div>
                            {analytics.globalFastestCorrect ? (
                                <>
                                    <p className="text-sm text-gray-600 mb-1 font-medium">{analytics.globalFastestCorrect.studentName}</p>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-warning" />
                                        <span className="text-xl font-bold text-gray-900">{analytics.globalFastestCorrect.time.toFixed(1)}s</span>
                                    </div>
                                    <p className="text-[10px] text-blue-400 mt-1 line-clamp-1">{analytics.globalFastestCorrect.questionText}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600 mb-1 font-medium">No speed data yet</p>
                                    <span className="text-gray-400">Fastest correct responder</span>
                                </>
                            )}
                        </div>
                        <div className="mt-4 pt-2 border-t border-blue-100 flex justify-between items-center">
                            <span className="text-xs text-blue-700 font-medium tracking-tight uppercase">Leader across questions</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-green-50 p-6 rounded-2xl border border-green-100"
                    >
                        <h4 className="font-bold text-green-800 mb-4">Live Performance Trend</h4>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full border-4 border-green-200 border-t-green-600 animate-spin-slow flex items-center justify-center">
                                <span className="text-lg font-bold text-green-700">{Math.round((analytics.finished / (analytics.totalEligible || 1)) * 100)}%</span>
                            </div>
                            <p className="text-sm text-green-700">Completion rate is healthy. Most students are finishing within the expected time.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Accuracy Chart */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" /> Accuracy per Question
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.questionAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="id"
                                        tickFormatter={(_: string, index: number) => `Q${index + 1}`}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val: number) => `${val}%`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${Math.round(Number(value))}% Accuracy`]}
                                        labelFormatter={(_: any, data: readonly any[]) => `Question: ${data[0]?.payload?.text}`}
                                    />
                                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                                        {analytics.questionAnalysis?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.accuracy < 50 ? '#ef4444' : entry.accuracy < 80 ? '#f59e0b' : '#10b981'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Score Distribution Chart */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" /> Score Distribution
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.scoreDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="range"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f5f3ff' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value} Students`]}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Progress Visualization */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Participation Overview</h2>

                        <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden mb-6">
                            <div
                                className="h-full bg-success transition-all duration-1000"
                                style={{ width: `${(analytics.finished / analytics.totalEligible) * 100}%` }}
                                title={`Finished: ${analytics.finished}`}
                            />
                            <div
                                className="h-full bg-warning transition-all duration-1000"
                                style={{ width: `${(analytics.active / analytics.totalEligible) * 100}%` }}
                                title={`Active: ${analytics.active}`}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-4">
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-success" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">Finished</span>
                                    <span className="text-sm text-gray-500">{Math.round((analytics.finished / analytics.totalEligible) * 100) || 0}% of students</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-warning" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">Currently Taking</span>
                                    <span className="text-sm text-gray-500">{Math.round((analytics.active / analytics.totalEligible) * 100) || 0}% of students</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-gray-200" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">Remaining</span>
                                    <span className="text-sm text-gray-500">{Math.round((analytics.notAttended / analytics.totalEligible) * 100) || 0}% of students</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Abstract background elements */}
                    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
                    <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-success/5 rounded-full blur-3xl -z-0" />
                </div>
            </div>
        </div>
    );
}
