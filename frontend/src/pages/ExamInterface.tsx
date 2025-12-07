import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Clock, ChevronLeft, ChevronRight, Flag, Menu, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamById, submitExam } from '../services/examService';
import { joinExamRoom, emitExamStart, emitExamSubmit } from '../services/socket';
import { getCurrentUser } from '../services/authService';

export default function ExamInterface() {
    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [flagged, setFlagged] = useState<Record<string, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (examId) {
            const user = getCurrentUser();
            joinExamRoom(examId);
            if (user && user._id) {
                emitExamStart(examId, user._id);
            }
        }
    }, [examId]);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                if (!examId) return;
                const data = await getExamById(examId);
                setExam(data);
                setTimeLeft(data.duration * 60);
            } catch (error) {
                console.error('Failed to fetch exam:', error);
                alert('Failed to load exam.');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [examId, navigate]);

    useEffect(() => {
        if (!exam) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [exam]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId: string, optionIndex: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    };

    const toggleFlag = (questionId: string) => {
        setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, optIdx]) => ({
                questionId: qId,
                selectedOption: optIdx
            }));

            if (examId) {
                await submitExam(examId, formattedAnswers);

                // Real-time: Notify monitors
                const user = getCurrentUser();
                if (user && user._id) {
                    emitExamSubmit(examId, user._id);
                }

                alert('Exam submitted successfully!');
                navigate('/dashboard'); // Or navigate to results page if implemented
            }
        } catch (error) {
            console.error('Failed to submit exam:', error);
            alert('Failed to submit exam. Please try again.');
            setSubmitting(false);
            setShowSubmitModal(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Exam...</div>;
    }

    if (!exam) {
        return <div className="min-h-screen flex items-center justify-center">Exam not found.</div>;
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                    >
                        <Menu className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">
                        {exam.title}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-medium ${timeLeft < 300 ? 'bg-red-50 text-error animate-pulse' : 'bg-blue-50 text-primary'
                        }`}>
                        <Clock className="h-5 w-5" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        className="hidden sm:flex bg-error hover:bg-red-700"
                        onClick={() => setShowSubmitModal(true)}
                        disabled={submitting}
                    >
                        Finish Exam
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar (Question Navigator) */}
                <AnimatePresence>
                    {(isSidebarOpen || window.innerWidth >= 1024) && (
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`absolute lg:relative z-10 w-72 h-full bg-white border-r border-gray-200 flex flex-col shadow-xl lg:shadow-none ${!isSidebarOpen && 'hidden lg:flex'
                                }`}
                        >
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center lg:hidden">
                                <span className="font-bold text-gray-700">Question Navigator</span>
                                <button onClick={() => setIsSidebarOpen(false)}>
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-4 gap-3">
                                    {exam.questions.map((q: any, idx: number) => {
                                        const isAnswered = answers[q._id] !== undefined;
                                        const isFlagged = flagged[q._id];
                                        const isCurrent = currentQuestionIndex === idx;

                                        return (
                                            <button
                                                key={q._id}
                                                onClick={() => {
                                                    setCurrentQuestionIndex(idx);
                                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                }}
                                                className={`relative h-10 w-10 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${isCurrent
                                                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                                                    : isAnswered
                                                        ? 'bg-blue-100 text-primary border border-blue-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {idx + 1}
                                                {isFlagged && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <Flag className="h-3 w-3 text-warning fill-warning" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                                        <span>Current</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="h-3 w-3 rounded-full bg-blue-100 border border-blue-200"></div>
                                        <span>Answered</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="h-3 w-3 rounded-full bg-gray-100"></div>
                                        <span>Not Answered</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Flag className="h-3 w-3 text-warning fill-warning" />
                                        <span>Flagged for Review</span>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
                    <div className="max-w-3xl mx-auto">
                        {/* Question Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        Question {currentQuestionIndex + 1} of {exam.questions.length}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 leading-relaxed">
                                        {currentQuestion.text}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => toggleFlag(currentQuestion._id)}
                                    className={`p-2 rounded-full transition-colors ${flagged[currentQuestion._id]
                                        ? 'bg-yellow-50 text-warning'
                                        : 'text-gray-400 hover:bg-gray-100'
                                        }`}
                                    title="Mark for Review"
                                >
                                    <Flag className={`h-6 w-6 ${flagged[currentQuestion._id] ? 'fill-warning' : ''}`} />
                                </button>
                            </div>

                            {/* Options */}
                            <div className="space-y-4 flex-1">
                                {currentQuestion.options.map((option: string, index: number) => (
                                    <label
                                        key={index}
                                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQuestion._id] === index
                                            ? 'border-primary bg-blue-50/50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${currentQuestion._id}`}
                                            value={index}
                                            checked={answers[currentQuestion._id] === index}
                                            onChange={() => handleAnswerSelect(currentQuestion._id, index)}
                                            className="h-5 w-5 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <span className={`ml-4 text-lg ${answers[currentQuestion._id] === index ? 'text-primary font-medium' : 'text-gray-700'
                                            }`}>
                                            {option}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center mt-8">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-5 w-5" /> Previous
                            </Button>

                            {currentQuestionIndex === exam.questions.length - 1 ? (
                                <Button
                                    variant="primary"
                                    className="bg-success hover:bg-green-600 gap-2"
                                    onClick={() => setShowSubmitModal(true)}
                                >
                                    Submit Exam
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                                    className="gap-2"
                                >
                                    Next <ChevronRight className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Submit Confirmation Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                                    <AlertCircle className="h-6 w-6 text-warning" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Exam?</h3>
                                <p className="text-gray-600 mb-6">
                                    You have answered <span className="font-bold text-primary">{Object.keys(answers).length}</span> out of <span className="font-bold">{exam.questions.length}</span> questions.
                                    Are you sure you want to finish?
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowSubmitModal(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1 bg-error hover:bg-red-700"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Confirm Submit'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
