import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, BarChart3, TrendingUp, Clock, Download, Share2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getExamStats } from '../services/examService';
import { getResultsByExam } from '../services/resultService';
import { initSocketConnection, joinExamRoom, leaveExamRoom, getSocket } from '../services/socket';

export default function ExamAnalytics() {
    const { examId } = useParams();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleShare = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link)
            .then(() => alert('Analytics link copied to clipboard!'))
            .catch(() => alert('Failed to copy link.'));
    };

    const handleDownloadReport = async () => {
        if (!stats?.exam || !examId) return;
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
            a.download = `${stats.exam.title.replace(/\s+/g, '_')}_Report.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Failed to download report. Please try again.');
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!examId) return;
            try {
                const data = await getExamStats(examId);
                setStats(data);
            } catch (err: any) {
                console.error('Failed to fetch exam stats:', err);
                setError(err.message || 'Failed to load statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Real-time updates
        if (examId) {
            initSocketConnection();
            joinExamRoom(examId);
            const socket = getSocket();

            socket.on('student-submitted-exam', () => {
                console.log('New submission received, refreshing stats...');
                fetchStats();
            });

            return () => {
                leaveExamRoom(examId);
                socket.off('student-submitted-exam');
            };
        }
    }, [examId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Statistics not found'}</p>
                    <Link to="/teacher/dashboard">
                        <Button>Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const insights = stats ? [
        {
            type: stats.passRate > 70 ? 'success' : stats.passRate > 50 ? 'info' : 'warning',
            title: 'Overall Performance',
            message: `Class pass rate is ${stats.passRate}%. Average score is ${stats.avgScore}%.`
        },
        (() => {
            const hardest = stats.questionPerformance?.reduce((prev: any, curr: any) =>
                (prev.correct < curr.correct) ? prev : curr
                , stats.questionPerformance[0]);
            return hardest ? {
                type: 'warning',
                title: 'Needs Focus',
                message: `Students struggled with Q${hardest.id} (${hardest.correct}% correct). Difficulty: ${hardest.difficulty}.`
            } : null;
        })(),
        (() => {
            const easiest = stats.questionPerformance?.reduce((prev: any, curr: any) =>
                (prev.correct > curr.correct) ? prev : curr
                , stats.questionPerformance[0]);
            return easiest ? {
                type: 'success',
                title: 'Strong Topic',
                message: `Most students aced Q${easiest.id} (${easiest.correct}% correct).`
            } : null;
        })()
    ].filter(Boolean) : [];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/teacher/dashboard">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{stats.exam.title}</h1>
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                Completed
                            </span>
                        </div>
                        <p className="text-gray-500 flex items-center gap-4">
                            <span>{new Date(stats.exam.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{stats.submitted}/{stats.totalStudents} Submissions</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2" onClick={handleShare}>
                            <Share2 className="h-4 w-4" /> Share
                        </Button>
                        <Button className="gap-2" onClick={handleDownloadReport}>
                            <Download className="h-4 w-4" /> Download Report
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        label="Average Score"
                        value={`${stats.avgScore}%`}
                        icon={BarChart3}
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                    <MetricCard
                        label="Pass Rate"
                        value={`${stats.passRate}%`}
                        icon={CheckCircle2}
                        color="text-green-600"
                        bg="bg-green-50"
                    />
                    <MetricCard
                        label="Highest Score"
                        value={`${stats.highest}%`}
                        icon={TrendingUp}
                        color="text-purple-600"
                        bg="bg-purple-50"
                    />
                    <MetricCard
                        label="Median Score"
                        value={`${stats.median}%`}
                        icon={Clock}
                        color="text-orange-600"
                        bg="bg-orange-50"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Score Distribution Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Score Distribution</h2>
                        <div className="space-y-4">
                            {stats.scoreDistribution.map((item: any, index: number) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{item.range}</span>
                                        <span className="text-gray-500">{item.count} students ({item.percentage}%)</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percentage}%` }}
                                            transition={{ duration: 1, delay: index * 0.1 }}
                                            className={`h-full ${item.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Insights Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" /> AI Insights
                        </h2>
                        <div className="space-y-4">
                            {insights.map((insight: any, index: number) => (
                                <div key={index} className={`p-4 rounded-lg border ${insight.type === 'warning' ? 'bg-yellow-50 border-yellow-100' :
                                    insight.type === 'success' ? 'bg-green-50 border-green-100' :
                                        'bg-blue-50 border-blue-100'
                                    }`}>
                                    <h3 className={`text-sm font-bold mb-1 ${insight.type === 'warning' ? 'text-yellow-800' :
                                        insight.type === 'success' ? 'text-green-800' :
                                            'text-blue-800'
                                        }`}>{insight.title}</h3>
                                    <p className={`text-sm ${insight.type === 'warning' ? 'text-yellow-700' :
                                        insight.type === 'success' ? 'text-green-700' :
                                            'text-blue-700'
                                        }`}>
                                        {insight.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Question Performance Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">Question Analysis</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">#</th>
                                    <th className="px-6 py-4 font-medium w-1/2">Question</th>
                                    <th className="px-6 py-4 font-medium">Difficulty</th>
                                    <th className="px-6 py-4 font-medium">Correct Response Rate</th>
                                    <th className="px-6 py-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.questionPerformance.map((q: any) => (
                                    <tr key={q.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-gray-500">{q.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{q.text}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                                q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                                                    <div
                                                        className={`h-full rounded-full ${q.correct > 80 ? 'bg-green-500' :
                                                            q.correct > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${q.correct}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{q.correct}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${bg} ${color}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
