import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, ArrowLeft, Share2, Download } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getResultById } from '../services/resultService';

export default function Results() {
    const { id } = useParams();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!id) return;
            try {
                const data = await getResultById(id);
                setResult(data);
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

    const percentage = (result.score / result.totalPoints) * 100;
    const correctAnswers = result.answers.filter((a: any) => a.isCorrect).length;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
                        </Button>
                    </Link>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" /> Download PDF
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Share2 className="h-4 w-4" /> Share
                        </Button>
                    </div>
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
        </div>
    );
}
