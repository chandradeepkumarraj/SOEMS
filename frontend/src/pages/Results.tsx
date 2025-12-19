import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getResultById, getResultAnalysis } from '../services/resultService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, XCircle, ArrowLeft, Download, Target, TrendingUp, Award } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Results() {
    const { id } = useParams();
    const [result, setResult] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handleDownloadPDF = async () => {
        setIsPrinting(true);
        // Wait for state update to hide buttons
        await new Promise(resolve => setTimeout(resolve, 100));

        const element = document.getElementById('result-report-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 10;

            const imgWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin;

            // First page
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - (margin * 2));

            // Extra pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + margin; // negative offset to slide image up
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - (margin * 2)); // Subtract usable page height
            }

            pdf.save(`${result.examId?.title || 'Exam'}_Result.pdf`);
        } catch (err) {
            console.error('PDF Generation failed:', err);
            setError('Failed to generate PDF');
        } finally {
            setIsPrinting(false);
        }
    };

    useEffect(() => {
        const fetchResult = async () => {
            if (!id) return;
            try {
                const [resultData, analysisData] = await Promise.all([
                    getResultById(id),
                    getResultAnalysis(id)
                ]);
                setResult(resultData);
                setAnalysis(analysisData);
            } catch (err: any) {
                console.error('Failed to fetch result:', err);
                setError(err.message || 'Failed to load result');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Result not found'}</p>
                    <Link to="/dashboard">
                        <Button>Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const percentage = result.totalPoints > 0 ? (result.score / result.totalPoints) * 100 : 0;
    const correctAnswers = result.answers.filter((a: any) => a.isCorrect).length;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto" id="result-report-content">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link to="/dashboard" className="no-print">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
                        </Button>
                    </Link>
                    {!isPrinting && (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleDownloadPDF}
                                disabled={isPrinting}
                            >
                                <Download className="h-4 w-4" />
                                {isPrinting ? 'Generating PDF...' : 'Download PDF'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8"
                >
                    <div className="bg-primary/5 p-8 text-center border-b border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{result.examId?.title || 'Exam Result'}</h1>
                        <p className="text-gray-500 mb-8">Submitted on {new Date(result.submittedAt).toLocaleString()}</p>

                        <div className="relative inline-flex items-center justify-center">
                            <svg className="w-40 h-40 transform -rotate-90">
                                <circle
                                    className="text-gray-200"
                                    strokeWidth="12"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                                <circle
                                    className="text-primary"
                                    strokeWidth="12"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * percentage) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-bold text-gray-900">{result.score}</span>
                                <span className="text-sm text-gray-500">/ {result.totalPoints}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-8 max-w-lg mx-auto">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-1">Correct</p>
                                <p className="text-xl font-bold text-success">{correctAnswers}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-1">Incorrect</p>
                                <p className="text-xl font-bold text-error">{result.answers.length - correctAnswers}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-1">Percentage</p>
                                <p className="text-xl font-bold text-gray-900">{Math.round(percentage)}%</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
                {/* Insights Section */}
                {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Topic Performance */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" /> Topic Analysis
                            </h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysis.topicPerformance}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="topic" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar
                                            name="Accuracy"
                                            dataKey="accuracy"
                                            stroke="#4F46E5"
                                            fill="#4F46E5"
                                            fillOpacity={0.6}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [`${parseFloat(value).toFixed(1)}%`, 'Accuracy']}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Peer Comparison */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Award className="h-8 w-8 text-indigo-200" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                                        {analysis.isInsightsAvailable ? 'Final Rank' : 'Progress Rank'}
                                    </span>
                                </div>

                                {analysis.isInsightsAvailable ? (
                                    <>
                                        <h4 className="text-sm font-medium text-indigo-100 mb-1">Class Rank</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black">#{analysis.classRank}</span>
                                            <span className="text-sm text-indigo-200">of {analysis.totalParticipants}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="text-sm font-medium text-indigo-100 mb-1">Percentile</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black">{analysis.percentile}th</span>
                                            <span className="text-sm text-indigo-200">percentile</span>
                                        </div>
                                    </>
                                )}

                                <p className="text-xs text-indigo-100 mt-4 leading-relaxed">
                                    {analysis.isInsightsAvailable
                                        ? `You performed better than ${analysis.percentile}% of students.`
                                        : 'Final rankings will be available after the exam closes.'}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-success">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Class Average</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-gray-900">{analysis.examAverage.toFixed(1)}</span>
                                            <span className="text-sm text-gray-400">/ {result.totalPoints}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-success transition-all duration-1000"
                                        style={{ width: `${(analysis.examAverage / result.totalPoints) * 100}%` }}
                                    ></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Peer Gap Analysis Section */}
                {analysis?.isInsightsAvailable && analysis?.peerGapQuestions?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 bg-amber-50 rounded-2xl border border-amber-100 p-6"
                    >
                        <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-amber-600" /> Growth Opportunities
                        </h3>
                        <p className="text-sm text-amber-800 mb-6">
                            Most students got these questions right. Reviewing these topics could significantly improve your performance next time!
                        </p>
                        <div className="space-y-3">
                            {analysis.peerGapQuestions.map((q: any, idx: number) => (
                                <div key={idx} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200/50 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{q.text}</p>
                                        <p className="text-xs text-amber-600 font-medium">{q.globalAccuracy.toFixed(0)}% of peers correct</p>
                                    </div>
                                    <div className="text-amber-500 font-bold text-xs uppercase tracking-wider">
                                        Review Needed
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Detailed Analysis */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Detailed Analysis</h2>
                    {result.answers.map((answer: any, idx: number) => (
                        <motion.div
                            key={answer.questionId._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-white rounded-xl border p-6 ${answer.isCorrect ? 'border-gray-200' : 'border-red-100 bg-red-50/10'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${answer.isCorrect ? 'bg-green-100 text-success' : 'bg-red-100 text-error'
                                    }`}>
                                    {answer.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 mb-4">
                                        <span className="text-gray-500 mr-2">Q{idx + 1}.</span>
                                        {answer.questionId?.text || 'Question'}
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div className={`p-3 rounded-lg ${answer.isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                                            }`}>
                                            <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                                            <p className={`font-medium ${answer.isCorrect ? 'text-success' : 'text-error'}`}>
                                                {answer.questionId?.options?.[answer.selectedOption] || `Option ${answer.selectedOption + 1}`}
                                            </p>
                                        </div>
                                        {!answer.isCorrect && (
                                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                <p className="text-xs text-gray-500 mb-1">Correct Answer</p>
                                                <p className="font-medium text-gray-900">
                                                    {answer.questionId?.options?.[answer.questionId.correctAnswer] || `Option ${answer.questionId?.correctAnswer + 1}`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Print-only CSS */}
            {/* Removed print-only CSS as we are using html2canvas */}
        </div>
    );
}
