import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Clock, ChevronLeft, ChevronRight, Flag, Menu, X, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamById, submitExam, startExamSession, updateExamProgress, logViolation } from '../services/examService';
import { joinExamRoom, leaveExamRoom, emitExamStart, emitExamSubmit, onExamClosedManually, emitProctorAlert, onStudentSuspended, onStudentUnsuspended } from '../services/socket';
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
    const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});
    const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(Date.now());
    const [isSuspended, setIsSuspended] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [syncStatus, setSyncStatus] = useState<'saved' | 'syncing' | 'error'>('saved');
    const [violationCount, setViolationCount] = useState(0);
    const [showCheatWarning, setShowCheatWarning] = useState<string | null>(null);

    // Refs for synchronization to avoid re-setting intervals
    const answersRef = useRef(answers);
    const flaggedRef = useRef(flagged);
    const timeSpentRef = useRef(questionTimeSpent);

    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { flaggedRef.current = flagged; }, [flagged]);
    useEffect(() => { timeSpentRef.current = questionTimeSpent; }, [questionTimeSpent]);

    const updateTimeSpent = useCallback(() => {
        if (!exam || !exam.questions[currentQuestionIndex]) return;
        const qId = exam.questions[currentQuestionIndex]._id;
        const now = Date.now();
        const elapsed = Math.floor((now - currentQuestionStartTime) / 1000);

        setQuestionTimeSpent(prev => {
            const next = {
                ...prev,
                [qId]: (prev[qId] || 0) + elapsed
            };
            timeSpentRef.current = next;
            return next;
        });
        setCurrentQuestionStartTime(now);
    }, [exam, currentQuestionIndex, currentQuestionStartTime]);

    const performSync = useCallback(async () => {
        if (!examId) return;
        setSyncStatus('syncing');
        try {
            updateTimeSpent();
            await updateExamProgress(examId, answersRef.current, timeSpentRef.current, flaggedRef.current);
            setSyncStatus('saved');
        } catch (err) {
            console.error('Sync failed:', err);
            setSyncStatus('error');
        }
    }, [examId, updateTimeSpent]);

    // Debounced sync ref
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedSync = useCallback(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setSyncStatus('syncing');
        syncTimeoutRef.current = setTimeout(performSync, 2000); // Sync after 2s of inactivity
    }, [performSync]);

    const handleSubmit = useCallback(async () => {
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, optIdx]) => ({
                questionId: qId,
                selectedOption: optIdx,
                timeSpent: questionTimeSpent[qId] || 0
            }));

            if (examId) {
                await submitExam(examId, formattedAnswers);

                // Real-time: Notify monitors
                const user = getCurrentUser();
                if (user && user._id) {
                    emitExamSubmit(examId, user._id);
                }

                alert('Exam submitted successfully!');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Failed to submit exam:', error);
            alert('Failed to submit exam. Please try again.');
            setSubmitting(false);
            setShowSubmitModal(false);
        }
    }, [examId, answers, navigate]);

    useEffect(() => {
        if (!examId) return;

        const user = getCurrentUser();
        joinExamRoom(examId);
        if (user && user._id) {
            emitExamStart(examId, user._id);
        }

        // Socket listener for manual termination
        const cleanup = onExamClosedManually(({ examId: closedId }) => {
            if (closedId === examId) {
                alert('This exam has been ended by the teacher. Your current progress will be submitted automatically.');
                handleSubmit();
            }
        });

        // Socket listener for suspension
        const cleanupSuspended = onStudentSuspended((data: any) => {
            if (data.examId === examId && data.studentId === user?._id) {
                setIsSuspended(true);
                setSuspensionReason(data.reason || 'Multiple proctoring violations detected.');
            }
        });

        // Socket listener for unsuspension
        const cleanupUnsuspended = onStudentUnsuspended((data: any) => {
            if (data.examId === examId && data.studentId === user?._id) {
                setIsSuspended(false);
                setSuspensionReason('');
                alert(data.message || 'Your exam session has been resumed. You can continue now.');
            }
        });

        return () => {
            cleanup();
            cleanupSuspended();
            cleanupUnsuspended();
            leaveExamRoom(examId);
        };
    }, [examId, handleSubmit]);

    useEffect(() => {
        const fetchExamAndSession = async () => {
            try {
                if (!examId) return;

                // 1. Get Exam Data
                const data = await getExamById(examId);
                setExam(data);

                // 2. Start/Resume Session
                const session = await startExamSession(examId);

                // 3. Load progress
                if (session.answers) {
                    setAnswers(session.answers);
                }
                if (session.flagged) {
                    setFlagged(session.flagged);
                }
                if (session.timeSpent) {
                    setQuestionTimeSpent(session.timeSpent);
                }
                if (session.violationCount) {
                    setViolationCount(session.violationCount);
                }

                // Calculate time left from start time and duration, synced with server
                const serverNow = new Date(session.serverTime).getTime();
                const start = new Date(session.startTime).getTime();
                const elapsedSeconds = Math.floor((serverNow - start) / 1000);
                const totalDurationSeconds = data.duration * 60;
                const remaining = Math.max(0, totalDurationSeconds - elapsedSeconds);

                setTimeLeft(remaining);

                if (remaining <= 0) {
                    alert('Time for this exam has already expired.');
                    navigate('/dashboard');
                }

            } catch (error: any) {
                console.error('Failed to load exam session:', error);
                if (error.response?.data?.isSuspended) {
                    setIsSuspended(true);
                    setSuspensionReason(error.response.data.message);
                    setLoading(false);
                    return;
                }
                alert(error.response?.data?.message || 'Failed to load exam.');
                navigate('/dashboard');
            } finally {
                if (!isSuspended) setLoading(false);
            }
        };
        fetchExamAndSession();
    }, [examId, navigate]);

    useEffect(() => {
        if (!exam || !examId) return;

        // 1. Timer loop
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

        // 2. Periodic Progress Sync (every 30 seconds)
        const syncInterval = setInterval(() => {
            // Check if already syncing to prevent overlap
            if (syncStatus === 'syncing') return;

            updateTimeSpent();
            updateExamProgress(examId, answersRef.current, timeSpentRef.current, flaggedRef.current).catch(console.error);
        }, 30000);

        return () => {
            clearInterval(timer);
            clearInterval(syncInterval);
        };
    }, [examId, exam, handleSubmit, updateTimeSpent]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId: string, optionIndex: number) => {
        setAnswers((prev) => {
            const newAnswers = { ...prev, [questionId]: optionIndex };
            debouncedSync();
            return newAnswers;
        });
    };

    const handleQuestionChange = (newIndex: number) => {
        updateTimeSpent();
        setCurrentQuestionIndex(newIndex);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };



    const triggerAlert = useCallback(async (type: string, message: string) => {
        const currentCount = violationCount + 1;
        setViolationCount(currentCount);

        const threshold = exam?.proctoringConfig?.violationThreshold || 5;
        const chancesLeft = Math.max(0, threshold - currentCount);

        // Warning Message
        const warningSuffix = chancesLeft > 0
            ? `Warning: ${chancesLeft} chances remaining before auto-submission.`
            : `CRITICAL: Violation threshold reached. Attempting final submission...`;

        setShowCheatWarning(`${message} | ${warningSuffix}`);
        setTimeout(() => setShowCheatWarning(null), 6000);

        if (examId) {
            const user = getCurrentUser();
            if (user?._id) {
                emitProctorAlert(examId!, user._id, user.name, user.rollNo || 'N/A', type, message);

                try {
                    const result = await logViolation(examId, { type, message });
                    if (result.isSuspended) {
                        // 1. Mark as suspended UI-side
                        setIsSuspended(true);
                        setSuspensionReason(`Automated suspension: Reached threshold of ${result.threshold} violations.`);

                        // 2. Perform Final Auto-Submit
                        const formattedAnswers = Object.entries(answersRef.current).map(([qId, optIdx]) => ({
                            questionId: qId,
                            selectedOption: optIdx,
                            timeSpent: timeSpentRef.current[qId] || 0
                        }));
                        await submitExam(examId, formattedAnswers);
                        emitExamSubmit(examId, user._id);
                    }
                } catch (err) {
                    console.error('Failed to log violation:', err);
                }
            }
        }
    }, [examId, exam, violationCount]);

    const enterFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {
                triggerAlert('Fullscreen Blocked', 'Please enable fullscreen to continue the exam.');
            });
        }
    }, [triggerAlert]);

    useEffect(() => {
        if (!loading && exam) {
            const config = exam.proctoringConfig || {
                enableTabLock: true,
                enableFullscreen: true,
                enableInputLock: true
            };

            // 1. Initial Fullscreen Prompt
            if (config.enableFullscreen) {
                enterFullscreen();
            }

            // 2. Tab/Window Switched Detection
            const handleVisibilityChange = () => {
                if (config.enableTabLock && document.hidden) {
                    triggerAlert('Tab Switched', 'Warning: Tab switching is strictly prohibited.');
                }
            };

            const handleBlur = () => {
                if (config.enableTabLock) {
                    triggerAlert('Window Blur', 'Warning: Focus lost from exam window.');
                }
            };

            // 3. Fullscreen Exit Detection
            const handleFullscreenChange = () => {
                if (config.enableFullscreen && !document.fullscreenElement) {
                    triggerAlert('Fullscreen Exit', 'You must remain in fullscreen mode during the exam.');
                }
            };

            // 4. Input Blocking (Keyboard & Mouse)
            const handleContextMenu = (e: MouseEvent) => {
                if (config.enableInputLock) {
                    e.preventDefault();
                    triggerAlert('Right Click', 'Warning: Right-clicking is strictly prohibited.');
                }
            };

            const handleKeyDown = (e: KeyboardEvent) => {
                if (!config.enableInputLock) return;

                // Block PrintScreen, F12 (DevTools), Ctrl+Shift+I (DevTools), Ctrl+U (Source), Ctrl+P (Print)
                const forbiddenKeys = ['F12', 'PrintScreen'];
                const ctrlKeys = ['c', 'v', 'u', 'i', 'p', 's', 'j'];

                if (forbiddenKeys.includes(e.key) || (e.ctrlKey && ctrlKeys.includes(e.key.toLowerCase()))) {
                    e.preventDefault();
                    triggerAlert('Keyboard Shortcut', `Unauthorized keyboard shortcut detected: ${e.key}`);
                }
            };

            // 5. Copy/Paste Blocking
            const handleCopyPaste = (e: ClipboardEvent) => {
                if (config.enableInputLock) {
                    e.preventDefault();
                    triggerAlert('Clipboard', 'Copying and pasting is not allowed.');
                }
            };

            // 6. Mouse Tracking
            const handleMouseLeave = () => {
                if (config.enableTabLock) {
                    triggerAlert('Cursor Out', 'Warning: Your cursor moved out of the exam window.');
                }
            };

            window.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleBlur);
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            window.addEventListener('contextmenu', handleContextMenu);
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('copy', handleCopyPaste);
            window.addEventListener('paste', handleCopyPaste);
            document.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                window.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleBlur);
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
                window.removeEventListener('contextmenu', handleContextMenu);
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('copy', handleCopyPaste);
                window.removeEventListener('paste', handleCopyPaste);
                document.removeEventListener('mouseleave', handleMouseLeave);
            };
        }
    }, [loading, exam, triggerAlert, enterFullscreen]);

    const toggleFlag = (questionId: string) => {
        setFlagged((prev) => {
            const next = { ...prev, [questionId]: !prev[questionId] };
            debouncedSync();
            return next;
        });
    };


    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Exam...</div>;
    }

    if (isSuspended) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-4 border-red-500/50"
                >
                    <div className="h-20 w-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 mb-4 uppercase tracking-tight">Access Revoked</h1>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 mb-8 text-left">
                        <p className="text-red-800 dark:text-red-300 font-bold mb-2 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" /> REASON:
                        </p>
                        <p className="text-red-700 dark:text-red-400 leading-relaxed italic">"{suspensionReason}"</p>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 mb-8">
                        Your exam session has been suspended due to persistent proctoring violations.
                        This incident has been officially logged and reported to the examination authority.
                    </p>
                    <Button
                        variant="primary"
                        className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-black dark:hover:bg-white"
                        onClick={() => navigate('/dashboard')}
                    >
                        Return to Dashboard
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (!exam) {
        return <div className="min-h-screen flex items-center justify-center">Exam not found.</div>;
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-[var(--card-bg)] border-b border-[var(--border-main)] h-16 flex items-center justify-between px-4 sm:px-6 shadow-[var(--shadow-main)] z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
                    >
                        <Menu className="h-6 w-6 text-gray-600 dark:text-slate-400" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black text-gray-900 dark:text-slate-100 truncate max-w-[150px] sm:max-w-md">
                            {exam.title}
                        </h1>
                        <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Connection Lost' : 'Encrypted & Saved'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!document.fullscreenElement && (exam.proctoringConfig?.enableFullscreen ?? true) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30 animate-pulse"
                            onClick={enterFullscreen}
                        >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Go Fullscreen
                        </Button>
                    )}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-medium ${timeLeft < 300 ? 'bg-red-50 dark:bg-red-950/20 text-error animate-pulse' : 'bg-blue-50 dark:bg-blue-950/20 text-primary'
                        }`}>
                        <Clock className="h-5 w-5" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <Button
                        variant="error"
                        size="sm"
                        className="hidden sm:flex"
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
                            className={`absolute lg:relative z-10 w-72 h-full bg-[var(--card-bg)] border-r border-[var(--border-main)] flex flex-col shadow-xl lg:shadow-none ${!isSidebarOpen && 'hidden lg:flex'
                                }`}
                        >
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center lg:hidden">
                                <span className="font-bold text-gray-700 dark:text-slate-300">Question Navigator</span>
                                <button onClick={() => setIsSidebarOpen(false)}>
                                    <X className="h-5 w-5 text-gray-500 dark:text-slate-400" />
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
                                                onClick={() => handleQuestionChange(idx)}
                                                className={`relative h-10 w-10 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${isCurrent
                                                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                                                    : isAnswered
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
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
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                                        <span>Current</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50"></div>
                                        <span>Answered</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full bg-gray-100 dark:bg-slate-800"></div>
                                        <span>Not Answered</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                        <Flag className="h-3 w-3 text-warning fill-warning" />
                                        <span>Flagged for Review</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-8 mt-8">
                                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="text-2xl font-black text-primary dark:text-blue-400">{Object.keys(answers).length}</div>
                                        <div className="text-[10px] font-black text-primary/60 dark:text-blue-400/60 uppercase tracking-widest">Attempted</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <div className="text-2xl font-black text-gray-900 dark:text-slate-100">{exam.questions.length - Object.keys(answers).length}</div>
                                        <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Remaining</div>
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
                        <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-main)] border border-[var(--border-main)] p-6 sm:p-8 min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                        Question {currentQuestionIndex + 1} of {exam.questions.length}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-50 mt-2 leading-relaxed">
                                        {currentQuestion.text}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => toggleFlag(currentQuestion._id)}
                                    className={`p-2.5 rounded-xl transition-all duration-300 ${flagged[currentQuestion._id]
                                        ? 'bg-warning/20 text-warning ring-2 ring-warning/50'
                                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                                            ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'border-[var(--border-main)] hover:border-primary/50 hover:bg-[var(--bg-main)]'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${currentQuestion._id}`}
                                            value={index}
                                            checked={answers[currentQuestion._id] === index}
                                            onChange={() => handleAnswerSelect(currentQuestion._id, index)}
                                            className="h-5 w-5 text-primary border-gray-300 dark:border-slate-700 focus:ring-primary bg-white dark:bg-slate-950"
                                        />
                                        <span className={`ml-4 text-lg ${answers[currentQuestion._id] === index ? 'text-primary dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-slate-300'
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
                                onClick={() => handleQuestionChange(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-5 w-5" /> Previous
                            </Button>

                            {currentQuestionIndex === exam.questions.length - 1 ? (
                                <Button
                                    variant="success"
                                    className="gap-2"
                                    onClick={() => setShowSubmitModal(true)}
                                >
                                    Submit Exam
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={() => handleQuestionChange(Math.min(exam.questions.length - 1, currentQuestionIndex + 1))}
                                    className="gap-2"
                                >
                                    Next <ChevronRight className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Cheating Warning Overlay */}
            <AnimatePresence>
                {showCheatWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border-2 border-white/20 backdrop-blur-md"
                    >
                        <AlertCircle className="h-8 w-8 animate-bounce" />
                        <div>
                            <p className="font-bold text-lg">{showCheatWarning?.split(' | ')[0]}</p>
                            <p className="text-sm font-black bg-white/20 px-2 py-0.5 rounded mt-1">{showCheatWarning?.split(' | ')[1]}</p>
                            <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest font-bold">In-Progress Violation Audit #{violationCount}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Confirmation Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                                    <AlertCircle className="h-6 w-6 text-warning" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Submit Exam?</h3>
                                <p className="text-gray-600 dark:text-slate-400 mb-6">
                                    You have answered <span className="font-bold text-primary dark:text-blue-400">{Object.keys(answers).length}</span> out of <span className="font-bold dark:text-slate-200">{exam.questions.length}</span> questions.
                                    Are you sure you want to finish?
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1 dark:border-slate-700 dark:text-slate-300"
                                        onClick={() => setShowSubmitModal(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="error"
                                        className="flex-1"
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
