import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Clock, ShieldAlert, WifiOff, X, Flag, MonitorOff, Menu, AlertCircle, Activity, Cpu, Zap, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getExamById, submitExam, startExamSession, updateExamProgress, logViolation, getNextAdaptiveQuestion, submitAdaptiveAnswer } from '../services/examService';
import { getSocket, joinExamRoom, leaveExamRoom, emitExamStart, emitExamSubmit, onExamClosedManually, emitProctorAlert, onStudentSuspended, onStudentUnsuspended, onIntercomMessage } from '../services/socket';
import { getCurrentUser } from '../services/authService';
import { saveProgressOffline, getOfflineProgress, syncOfflineProgress, clearOfflineProgress } from '../services/offlineSyncService';
import { getApiUrl } from '../config/apiConfig';
import WatermarkOverlay from '../components/exam/WatermarkOverlay';
import BehavioralProctor from '../components/exam/BehavioralProctor';
import VirtualExamHall from '../components/exam/VirtualExamHall';
import { isBraveBrowser } from '../utils/browserDetection';
import { useAIStatus } from '../hooks/useAIStatus';

// ==========================================
// ADAPTIVE EXAM VIEW (C.A.T.) - Round 4
// ==========================================
function AdaptiveExamView({ examId, examTitle, timeLeft, navigate, violationCount, showCheatWarning, syncStatus, socketConnected, setSyncStatus, formatTime, isPausedRef, submittingRef }: {
    examId: string; examTitle: string; timeLeft: number; navigate: any;
    violationCount: number; showCheatWarning: string | null; syncStatus: string;
    socketConnected: boolean;
    setSyncStatus: (status: 'idle' | 'syncing' | 'saved' | 'error') => void;
    formatTime: (s: number) => string;
    isPausedRef: React.MutableRefObject<boolean>;
    submittingRef: React.MutableRefObject<boolean>;
}) {
    const { t } = useTranslation();
    const { getModelDisplayName } = useAIStatus();
    const [currentQ, setCurrentQ] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [textAnswer, setTextAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; newDifficulty: string } | null>(null);
    const [adaptiveLoading, setAdaptiveLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [adaptiveError, setAdaptiveError] = useState<string | null>(null);
    const [stats, setStats] = useState({ answered: 0, total: 15, correct: 0 });

    const fetchNext = async () => {
        setAdaptiveError(null);
        setAdaptiveLoading(true);
        setSelectedOption(null);
        setTextAnswer('');
        setFeedback(null);
        try {
            const data = await getNextAdaptiveQuestion(examId);
            if (data.error) {
                setGenerating(false);
                setAdaptiveError(data.message);
                return; // Do NOT retry on permanent failures (e.g. Generation Failed)
            }
            if (data.generating) {
                setGenerating(true);
                // Retry in 5 seconds
                setTimeout(() => fetchNext(), 5000);
            } else if (data.completed) {
                setGenerating(false);
                setCompleted(true);
                // Auto-submit the exam
                try {
                    await submitExam(examId, []);
                } catch (e: any) {
                    console.warn('Auto-submit already handled or failed silently:', e.message);
                }
            } else {
                setGenerating(false);
                setCurrentQ(data);
                setStats(prev => ({
                    ...prev,
                    total: data.totalQuestions,
                    answered: data.stats?.answered ?? prev.answered,
                    correct: data.stats?.correct ?? prev.correct
                }));
            }
        } catch (err: any) {
            console.error('Adaptive fetch error:', err);
            const status = err?.response?.status;
            const msg = err?.response?.data?.message || err?.message || 'Failed to load the next question.';

            // CRITICAL: Handle Session Lost (Teacher Reset or Session Expiry)
            if (status === 404) {
                console.warn('Adaptive Session Lost. Terminating interface.');
                alert('Your exam session has been terminated (possibly due to an exam reset by the teacher). You will be redirected to the dashboard.');
                navigate('/dashboard');
                return;
            }

            setAdaptiveError(msg);
            // Retry after 5 seconds on other transient errors (Network, 500 etc)
            setTimeout(() => fetchNext(), 5000);
        } finally {
            setAdaptiveLoading(false);
        }
    };

    const handleAnswer = async () => {
        if (!currentQ) return;
        if (currentQ.type === 'descriptive' && !textAnswer.trim()) return;
        if (currentQ.type !== 'descriptive' && selectedOption === null) return;

        try {
            setSyncStatus('syncing');
            const result = await submitAdaptiveAnswer(examId, currentQ._id, selectedOption as number, textAnswer);
            setSyncStatus('saved');
            setFeedback({ isCorrect: result.isCorrect, newDifficulty: result.newDifficulty });
            setStats(prev => ({ ...prev, answered: prev.answered + 1, correct: result.isCorrect ? prev.correct + 1 : prev.correct }));

            // Wait 1.5s to show feedback before next question
            setTimeout(() => {
                fetchNext();
            }, 1500);
        } catch (err: any) {
            console.error('Submit adaptive answer error:', err);
            setSyncStatus('error');
        }
    };

    useEffect(() => { fetchNext(); }, []);

    // Auto-submit when timer expires
    useEffect(() => {
        if (timeLeft <= 0 && !completed) {
            if (submittingRef.current) return; // Prevent race condition with manual submit

            setCompleted(true);
            (async () => {
                try {
                    isPausedRef.current = true; // Paralyze proctoring during auto-submit
                    setSyncStatus('syncing');
                    await submitExam(examId, []);
                    setSyncStatus('saved');
                } catch (e: any) {
                    console.error('Final adaptive submit failed:', e);
                    setSyncStatus('error');
                    alert('Submission failed. Please click "Check Status" or try to reload.');
                }
                const successSound = new Audio('/assets/sounds/notify_sound.mp3');
                successSound.volume = 0.6;
                successSound.play().catch(() => { });
                navigate('/dashboard');
            })();
        }
    }, [timeLeft, completed, examId, navigate]);

    const difficultyColors: Record<string, string> = {
        easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };

    if (adaptiveError && adaptiveError.toLowerCase().includes('session')) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-lg w-full shadow-2xl border border-red-500/30">
                    <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Internal Pipeline Error</h2>
                    <p className="text-slate-500 mb-8">{adaptiveError}</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full h-12">
                        Return to Hub
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (generating) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 max-w-md">
                    <div className="relative h-24 w-24 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                        <Cpu className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('exam.preparing_cat')}</h2>
                        <p className="text-slate-400 text-sm font-bold">{getModelDisplayName()} is generating your unique question pool across difficulty tiers.</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 text-left">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('exam.cat_syncing')}</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
                    <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('exam.cat_complete')}</h1>
                    <p className="text-slate-500 mb-6">{t('exam.cat_submitted')}</p>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t('exam.cat_answered')}</p><p className="text-2xl font-black text-slate-900 dark:text-white">{stats.answered}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t('exam.cat_correct')}</p><p className="text-2xl font-black text-green-600">{stats.correct}</p></div>
                    </div>
                    <Button variant="primary" className="w-full" onClick={() => navigate('/dashboard')}>{t('exam.return_hub')}</Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 select-none flex flex-col h-screen overflow-hidden">
            {/* Offline Banner for Adaptive Mode */}
            <AnimatePresence>
                {!window.navigator.onLine && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 z-[100] shadow-lg sticky top-0"
                    >
                        <WifiOff className="h-4 w-4 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">{t('exam.offline')}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <WatermarkOverlay />
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white">{examTitle}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 uppercase tracking-widest">
                                <Zap className="h-3 w-3" /> Adaptive Mode (C.A.T.)
                            </p>
                            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        {syncStatus === 'syncing' ? t('exam.syncing') : syncStatus === 'error' ? 'Sync Error' : t('exam.saved')}
                                    </span>
                                </div>
                                <div className="w-px h-2 bg-slate-200 dark:bg-slate-800"></div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`}></div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${socketConnected ? 'text-slate-400' : 'text-red-500 font-bold'}`}>
                                        {socketConnected ? t('exam.live_connection') : t('exam.disconnected')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {currentQ && (
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${difficultyColors[currentQ.currentDifficulty] || difficultyColors.medium}`}>
                                {currentQ.currentDifficulty}
                            </span>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="h-4 w-4" />
                            <span className={`font-mono font-bold text-sm ${timeLeft < 300 ? 'text-red-500 animate-pulse' : ''}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar & Proctoring Summary */}
            <div className="max-w-3xl mx-auto mt-6 px-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                            Question {currentQ?.questionNumber || '...'} of {stats.total}
                        </span>
                        {violationCount > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-md font-black uppercase">
                                {violationCount} Violations
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-bold text-amber-600">{stats.answered} answered</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        animate={{ width: `${(stats.answered / stats.total) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Warning Message Overlay */}
            <AnimatePresence>
                {showCheatWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
                    >
                        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-red-500">
                            <ShieldAlert className="h-8 w-8 animate-pulse shrink-0" />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-80">Security Alert</p>
                                <p className="text-sm font-bold leading-tight">{showCheatWarning}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error State */}
            {adaptiveError && !adaptiveLoading && !generating && (
                <div className="max-w-3xl mx-auto mt-8 px-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
                        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Connection Issue</h3>
                        <p className="text-sm text-red-600 dark:text-red-300 mb-4">{adaptiveError}</p>
                        <p className="text-xs text-slate-500 mb-4">Retrying automatically in 5 seconds...</p>
                        <Button onClick={() => { setAdaptiveError(null); fetchNext(); }} className="bg-red-500 hover:bg-red-600 text-white px-6">
                            Retry Now
                        </Button>
                    </div>
                </div>
            )}

            {/* Question Card */}
            <div className="max-w-3xl mx-auto mt-8 px-6">
                <AnimatePresence mode="wait">
                    {adaptiveLoading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div>
                            <p className="text-slate-500 font-bold">Selecting next question...</p>
                        </motion.div>
                    ) : currentQ ? (
                        <motion.div key={currentQ._id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${difficultyColors[currentQ.difficulty] || difficultyColors.medium}`}>
                                    {currentQ.difficulty}
                                </span>
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                                    Q{currentQ.questionNumber}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-8 leading-relaxed">{currentQ.text}</h2>

                            <div className="space-y-3">
                                {currentQ.type === 'descriptive' ? (
                                    <div className="space-y-4">
                                        <textarea
                                            value={textAnswer}
                                            disabled={!!feedback}
                                            onChange={(e) => setTextAnswer(e.target.value)}
                                            placeholder="Write your comprehensive answer here..."
                                            className="w-full h-64 p-6 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-amber-500 outline-none transition-all resize-none shadow-sm font-medium text-slate-700 dark:text-slate-300 select-text"
                                        />
                                        <div className="flex justify-between items-center px-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Characters: {textAnswer.length}</p>
                                            <p className="text-[10px] text-amber-500 font-black italic uppercase tracking-tighter">{getModelDisplayName()}-Enabled Grading Active</p>
                                        </div>
                                    </div>
                                ) : (
                                    (currentQ.options || []).map((opt: string, idx: number) => {
                                        let optClass = 'border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500';
                                        if (feedback) {
                                            if (idx === selectedOption && feedback.isCorrect) optClass = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                                            else if (idx === selectedOption && !feedback.isCorrect) optClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                                        } else if (idx === selectedOption) {
                                            optClass = 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500/30';
                                        }
                                        return (
                                            <button
                                                key={idx}
                                                disabled={!!feedback}
                                                onClick={() => setSelectedOption(idx)}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optClass}`}
                                            >
                                                <span className="text-xs font-black text-slate-400 mr-3">{String.fromCharCode(65 + idx)}.</span>
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{opt}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Submit / Feedback */}
                            <div className="mt-8 flex items-center justify-between">
                                {feedback ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${feedback.isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {feedback.isCorrect ? '✓ Correct!' : '✗ Incorrect'} → Next: {feedback.newDifficulty}
                                    </motion.div>
                                ) : (
                                    <Button onClick={handleAnswer} disabled={
                                        currentQ?.type === 'descriptive'
                                            ? !textAnswer.trim()
                                            : selectedOption === null
                                    } className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                                        Submit Answer
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function ExamInterface() {
    const { t } = useTranslation();
    useAIStatus(); // Ensure initialized but not using specific variables here
    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [flagged, setFlagged] = useState<Record<string, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});
    const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(Date.now());
    const [isSuspended, setIsSuspended] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'saved' | 'syncing' | 'error'>('saved');
    const [violationCount, setViolationCount] = useState(0);
    const [showCheatWarning, setShowCheatWarning] = useState<string | null>(null);
    const [isChrome, setIsChrome] = useState(true);
    const [isBrave, setIsBrave] = useState(false);
    const [socketConnected, setSocketConnected] = useState(true);
    const [isViolationPaused, setIsViolationPaused] = useState(false);
    const [pauseCountdown, setPauseCountdown] = useState(0);
    const [violationAlertMessage, setViolationAlertMessage] = useState<string>('');
    const [sessionInitialized, setSessionInitialized] = useState(false);
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);
    const [examStage, setExamStage] = useState<'loading' | 'instructions' | 'hall' | 'active'>('loading');
    const [activeIntercomAlert, setActiveIntercomAlert] = useState<{ message: string; sender: string } | null>(null);
    const [hasIdCard, setHasIdCard] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Refs moved up to avoid "Cannot find name" initialization errors in effects
    const isPausedRef = useRef(false);
    const submittingRef = useRef(false);

    const [showFullscreenLock, setShowFullscreenLock] = useState(false);
    const examRef = useRef(exam);
    const violationCountRef = useRef(violationCount);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastViolationTimeRef = useRef<number>(0);
    const mouseLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const showSubmitModalRef = useRef(false);
    const examStageRef = useRef(examStage);
    const sharedStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => { examRef.current = exam; }, [exam]);
    useEffect(() => { violationCountRef.current = violationCount; }, [violationCount]);
    useEffect(() => { submittingRef.current = submitting; }, [submitting]);
    useEffect(() => { showSubmitModalRef.current = showSubmitModal; }, [showSubmitModal]);
    useEffect(() => { examStageRef.current = examStage; }, [examStage]);

    useEffect(() => {
        // Detect Chromium-based browsers (Chrome, Edge, Brave, Opera)
        const isChromium = !!(window as any).chrome;
        const isIOSChrome = /CriOS/.test(navigator.userAgent);

        if (!isChromium && !isIOSChrome) {
            setIsChrome(false);
        }

        const checkBrave = async () => {
            const braveDetected = await isBraveBrowser();
            setIsBrave(braveDetected);
        };
        checkBrave();
    }, []);

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
            // Save Offline
            if (examId) saveProgressOffline(examId, answersRef.current, next, flaggedRef.current);
            return next;
        });
        setCurrentQuestionStartTime(now);
    }, [exam, currentQuestionIndex, currentQuestionStartTime]);

    const performSync = useCallback(async () => {
        if (!examId) return;
        setSyncStatus('syncing');
        try {
            updateTimeSpent();
            await updateExamProgress(examId, exam?.isAdaptive ? undefined : answersRef.current, timeSpentRef.current, flaggedRef.current);
            setSyncStatus('saved');
        } catch (err) {
            console.error('Sync failed:', err);
            setSyncStatus('error');
        }
    }, [examId, exam, updateTimeSpent]);

    // Debounced sync ref
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedSync = useCallback(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setSyncStatus('syncing');
        syncTimeoutRef.current = setTimeout(performSync, 2000); // Sync after 2s of inactivity
    }, [performSync]);

    const handleSubmit = useCallback(async () => {
        if (submittingRef.current) return; // Prevention for double-submits
        setSubmitting(true);
        submittingRef.current = true; // Immediate sync for zero-latency proctoring gating
        isPausedRef.current = true; // Paralyze all proctoring listeners instantly during network submit

        try {
            const formattedAnswers = Object.entries(answers).map(([qId, val]) => {
                const q = exam.questions.find((q: any) => q._id === qId);
                return {
                    questionId: qId,
                    selectedOption: q?.type === 'mcq' ? (typeof val === 'number' ? val : undefined) : undefined,
                    textAnswer: q?.type === 'descriptive' ? (typeof val === 'string' ? val : undefined) : undefined,
                    timeSpent: questionTimeSpent[qId] || 0
                };
            });

            if (examId) {
                await submitExam(examId, formattedAnswers);
                clearOfflineProgress(examId); // Clear cache on successful completion

                // Real-time: Notify monitors
                const user = getCurrentUser();
                if (user && user._id) {
                    emitExamSubmit(examId, user._id);
                }

                alert('Exam submitted successfully.');
                const successSound = new Audio('/assets/sounds/notify_sound.mp3');
                successSound.volume = 0.6;
                successSound.play().catch(() => { });
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Failed to submit exam:', error);
            alert('Failed to submit exam. Please try again.');
            setSubmitting(false);
            submittingRef.current = false;
            isPausedRef.current = false;
            setShowSubmitModal(false);
        }
    }, [examId, answers, navigate, exam, questionTimeSpent]);

    useEffect(() => {
        const socket = getSocket();
        const onConnect = () => setSocketConnected(true);
        const onDisconnect = () => setSocketConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        setSocketConnected(socket.connected);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

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
                alert(t('exam.session_closed'));
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
                setRefreshTrigger(prev => prev + 1);
                alert(data.message || 'Your exam session has been resumed. You can continue now.');
            }
        });

        // 3. Online/Offline Listeners for Sync
        const handleOnline = () => {
            if (examId) {
                syncOfflineProgress(examId)
                    .then(() => setSyncStatus('saved'))
                    .catch(() => setSyncStatus('error'));
            }
        };

        window.addEventListener('online', handleOnline);

        // 4. Initial Sync on Mount (if online)
        if (examId && window.navigator.onLine) {
            syncOfflineProgress(examId)
                .then(() => setSyncStatus('saved'))
                .catch(() => setSyncStatus('error'));
        }

        const cleanupIntercom = onIntercomMessage((data) => {
            if (data.studentId === user?._id) {
                // Play notification sound
                try {
                    const audio = new Audio('/assets/sounds/notify_sound.mp3');
                    audio.volume = 0.6;
                    audio.play().catch(() => { });
                } catch (e) {
                    console.warn('Intercom audio alert failed:', e);
                }
                setActiveIntercomAlert({ message: data.message, sender: data.sender });
            }
        });

        return () => {
            cleanup();
            cleanupSuspended();
            cleanupUnsuspended();
            cleanupIntercom();
            window.removeEventListener('online', handleOnline);
            leaveExamRoom(examId);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
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
                setHasIdCard(!!session.idCardFront);

                // 3. Load progress (Strategy: Server is baseline, Offline Cache is Fail-safe)
                let finalAnswers = session.answers || {};
                let finalFlagged = session.flagged || {};
                let finalTimeSpent = session.timeSpent || {};
                let finalViolationCount = session.violationCount || 0;

                const offlineData = getOfflineProgress(examId);
                if (offlineData) {
                    // Safety check: only use offline if last updated AFTER session start or if session has less data
                    // For now, simple merge/preference for offline works well for "Resume" scenarios
                    if (Object.keys(offlineData.answers).length >= Object.keys(finalAnswers).length) {
                        finalAnswers = { ...finalAnswers, ...offlineData.answers };
                    }
                    finalFlagged = { ...finalFlagged, ...offlineData.flagged };
                    finalTimeSpent = { ...finalTimeSpent, ...offlineData.timeSpent };
                }

                setAnswers(finalAnswers);
                setFlagged(finalFlagged);
                setQuestionTimeSpent(finalTimeSpent);
                setViolationCount(finalViolationCount);

                // Calculate time left based on actual time spent answering questions
                let remaining = data.duration * 60;
                const totalTimeSpentSeconds = Object.values(finalTimeSpent).reduce((acc: number, curr: any) => acc + (curr || 0), 0) as number;
                remaining = Math.max(0, remaining - totalTimeSpentSeconds);

                // Enforce hard end time boundary (if the exam closes at a specific time)
                const serverNow = new Date(session.serverTime).getTime();
                const examEnd = new Date(data.endTime).getTime();
                if (serverNow < examEnd) {
                    const secondsUntilEnd = Math.floor((examEnd - serverNow) / 1000);
                    remaining = Math.min(remaining, secondsUntilEnd);
                } else {
                    remaining = 0;
                }

                setTimeLeft(remaining);
                setSessionInitialized(true);

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

                // Handle "not started yet" or "expired" from backend
                const errorMessage = error.response?.data?.message || 'Failed to load exam.';
                alert(errorMessage);
                navigate('/dashboard');
            } finally {
                if (!isSuspended) {
                    setLoading(false);
                    setExamStage('hall');
                }
            }
        };
        fetchExamAndSession();
    }, [examId, navigate, refreshTrigger]);

    useEffect(() => {
        if (!exam || !examId) return;

        // 1. Timer loop
        const timer = setInterval(() => {
            // Optimization: If already submitting, just clear the interval
            if (submittingRef.current) {
                clearInterval(timer);
                return;
            }

            // Only tick down if the student is actively in the exam
            if (examStageRef.current !== 'active') return;

            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!submittingRef.current) handleSubmit(); // Auto-submit
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
            updateExamProgress(examId, exam?.isAdaptive ? undefined : answersRef.current, timeSpentRef.current, flaggedRef.current).catch(console.error);
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

    const handleAnswerSelect = (questionId: string, value: any) => {
        setAnswers((prev) => {
            const newAnswers = { ...prev, [questionId]: value };
            answersRef.current = newAnswers; // Sync Ref immediately to prevent stale submit on violation
            if (examId) saveProgressOffline(examId, newAnswers, timeSpentRef.current, flaggedRef.current);
            debouncedSync();
            return newAnswers;
        });
    };

    const handleQuestionChange = (newIndex: number) => {
        updateTimeSpent();
        setCurrentQuestionIndex(newIndex);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };



    const triggerAlertRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const alertBufferRef = useRef<AudioBuffer | null>(null);

    // Initialize AudioContext and load sound buffer
    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const loadSound = async () => {
            try {
                const response = await fetch('/assets/sounds/notify_sound.mp3');
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                alertBufferRef.current = audioBuffer;
            } catch (err) {
                console.warn('Failed to pre-load alert sound:', err);
            }
        };

        loadSound();

        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, []);

    const unlockAudio = useCallback(() => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(e => console.warn('AudioContext resume failed:', e));
        }
    }, []);

    const playAlert = useCallback(() => {
        const ctx = audioContextRef.current;
        const buffer = alertBufferRef.current;
        if (!ctx || !buffer) return;

        // Ensure context is running (unlock attempt)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.6;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
    }, []);

    const enterFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {
                triggerAlertRef.current?.('Fullscreen Blocked', 'Please enable fullscreen to continue the exam.');
            });
        }
    }, []);

    const triggerAlert = useCallback(async (type: string, message: string, evidence?: { snapshot?: string, transcript?: string }) => {
        // CRITICAL GATES: Ignore violations during submission, instructions, or Hall stage
        if (isPausedRef.current || submittingRef.current || isSuspended || !examId) return;
        if (examStageRef.current !== 'active') return;

        // Throttling: Ignore violations within 2.5s of each other to prevent UI spam and network flooding
        const now = Date.now();
        if (now - lastViolationTimeRef.current < 2500) return;

        lastViolationTimeRef.current = now;
        isPausedRef.current = true;
        setViolationAlertMessage(message);
        setIsViolationPaused(true);
        setPauseCountdown(5);


        // 2. Play Alert Sound using Web Audio API
        playAlert();

        // 3. Increment violation count
        const currentCount = violationCountRef.current + 1;
        setViolationCount(currentCount);

        const currentExam = examRef.current;
        const threshold = currentExam?.proctoringConfig?.violationThreshold || 5;
        const chancesLeft = Math.max(0, threshold - currentCount);

        // 4. Set Warning Message
        const warningSuffix = chancesLeft > 0
            ? `Warning: ${chancesLeft} chances remaining before auto-submission.`
            : `CRITICAL: Violation threshold reached. Attempting final submission...`;

        setShowCheatWarning(`${message} | ${warningSuffix}`);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setShowCheatWarning(null), 6000);

        // 5. Log to Backend (with evidence)
        if (examId) {
            const user = getCurrentUser();
            if (user?._id) {
                // Ensure proctoring is paused while submitting a critical violation
                if (chancesLeft <= 0) {
                    isPausedRef.current = true;
                    submittingRef.current = true;
                }

                emitProctorAlert(examId!, user._id, user.name, user.rollNo || 'N/A', type, message, evidence?.snapshot, evidence?.transcript);

                try {
                    const result = await logViolation(examId, { type, message, snapshot: evidence?.snapshot, transcript: evidence?.transcript });
                    if (result.isSuspended) {
                        setIsSuspended(true);
                        setSuspensionReason(`Automated suspension: Reached threshold of ${result.threshold} violations.`);

                        const formattedAnswers = Object.entries(answersRef.current).map(([qId, optIdx]) => ({
                            questionId: qId,
                            selectedOption: optIdx,
                            timeSpent: timeSpentRef.current[qId] || 0
                        }));
                        await submitExam(examId, formattedAnswers);
                        clearOfflineProgress(examId); // Clear cache on suspension submit
                        emitExamSubmit(examId, user._id);
                    }
                } catch (err) {
                    console.error('Failed to log violation:', err);
                }
            }
        }
    }, [examId, isSuspended, enterFullscreen]);

    // Dedicated Recovery Countdown Effect (Prevents Leaks)
    useEffect(() => {
        if (!isViolationPaused) return;

        const interval = setInterval(() => {
            setPauseCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // We DO NOT auto-resume here anymore.
                    // Instead, we wait for the student to click "Resume Exam"
                    // which provides the necessary user gesture for re-entering fullscreen.
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isViolationPaused, enterFullscreen]);

    // Update triggerAlertRef for enterFullscreen
    useEffect(() => {
        triggerAlertRef.current = triggerAlert;
    }, [triggerAlert]);

    useEffect(() => {
        if (!loading && exam) {
            const config = exam.proctoringConfig || {
                enableTabLock: true,
                enableFullscreen: true,
                enableInputLock: true
            };

            // 1. Tab/Window Switched Detection
            const handleVisibilityChange = () => {
                if (config.enableTabLock && document.hidden) {
                    // Graceful check: only trigger if still hidden after 100ms
                    setTimeout(() => {
                        if (document.hidden && !isPausedRef.current && !submittingRef.current) {
                            triggerAlert('Tab Switched', 'Warning: Tab switching is strictly prohibited.');
                        }
                    }, 100);
                }
            };

            const handleBlur = () => {
                if (config.enableTabLock) {
                    // Graceful check: only trigger if still blurred after 500ms
                    // This prevents false positives during internal navigation or layout shifts
                    setTimeout(() => {
                        if (!document.hasFocus() && !isPausedRef.current && !submittingRef.current) {
                            triggerAlert('Window Blur', 'Warning: Focus lost from exam window.');
                        }
                    }, 500);
                }
            };

            // 2. Fullscreen Exit Detection
            const handleFullscreenChange = () => {
                if (config.enableFullscreen && !document.fullscreenElement) {
                    if (examStageRef.current === 'active') {
                        if (isViolationPaused) return;
                        triggerAlertRef.current('Fullscreen Exit', 'You must remain in fullscreen mode during the exam.');
                    } else if (examStageRef.current === 'hall' || examStageRef.current === 'instructions') {
                        setShowFullscreenLock(true);
                    }
                } else if (document.fullscreenElement) {
                    setShowFullscreenLock(false);
                }
            };

            // 3. Input Blocking (Keyboard & Mouse)
            const handleContextMenu = (e: MouseEvent) => {
                if (config.enableInputLock) {
                    e.preventDefault();
                    triggerAlert('Right Click', 'Warning: Right-clicking is strictly prohibited.');
                }
            };

            const handleKeyDown = (e: KeyboardEvent) => {
                if (!config.enableInputLock) return;
                const forbiddenKeys = ['F12', 'PrintScreen', 'Meta'];
                const modKeys = ['c', 'v', 'u', 'i', 'p', 's', 'j', 'a'];
                if (forbiddenKeys.includes(e.key) || ((e.ctrlKey || e.metaKey) && modKeys.includes(e.key.toLowerCase()))) {
                    e.preventDefault();
                    triggerAlert('Keyboard Shortcut', `Unauthorized keyboard shortcut detected: ${e.key}`);
                }
            };

            const handleCopyPaste = (e: ClipboardEvent) => {
                if (config.enableInputLock) {
                    e.preventDefault();
                    triggerAlert('Clipboard', 'Copying and pasting is not allowed.');
                }
            };

            // 4. Mouse Tracking
            const handleMouseLeave = () => {
                if (config.enableTabLock) {
                    if (mouseLeaveTimeoutRef.current) clearTimeout(mouseLeaveTimeoutRef.current);
                    mouseLeaveTimeoutRef.current = setTimeout(() => {
                        if (!isPausedRef.current && !submittingRef.current) {
                            triggerAlert('Cursor Out', 'Warning: Your cursor moved out of the exam window.');
                        }
                    }, 750); // Increased grace period for mouse movement
                }
            };

            const handleMouseEnter = () => {
                if (mouseLeaveTimeoutRef.current) {
                    clearTimeout(mouseLeaveTimeoutRef.current);
                    mouseLeaveTimeoutRef.current = null;
                }
            };

            const handleMouseMove = () => {
                if (mouseLeaveTimeoutRef.current) {
                    clearTimeout(mouseLeaveTimeoutRef.current);
                    mouseLeaveTimeoutRef.current = null;
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
            document.addEventListener('mouseenter', handleMouseEnter);
            document.addEventListener('mousemove', handleMouseMove);

            return () => {
                window.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleBlur);
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
                window.removeEventListener('contextmenu', handleContextMenu);
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('copy', handleCopyPaste);
                window.removeEventListener('paste', handleCopyPaste);
                document.removeEventListener('mouseleave', handleMouseLeave);
                document.removeEventListener('mouseenter', handleMouseEnter);
                document.removeEventListener('mousemove', handleMouseMove);
                if (mouseLeaveTimeoutRef.current) clearTimeout(mouseLeaveTimeoutRef.current);
            };
        }
    }, [loading, exam, triggerAlert, enterFullscreen, isViolationPaused]);

    const toggleFlag = (questionId: string) => {
        setFlagged((prev) => {
            const next = { ...prev, [questionId]: !prev[questionId] };
            flaggedRef.current = next; // Sync Ref immediately
            if (examId) saveProgressOffline(examId, answersRef.current, timeSpentRef.current, next);
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
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="w-full border-2 border-slate-200 dark:border-slate-700 font-black uppercase text-xs tracking-widest h-12"
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                        >
                            <Activity className="h-4 w-4 mr-2" /> Check Status
                        </Button>
                        <Button
                            variant="primary"
                            className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-black dark:hover:bg-white font-black uppercase text-xs tracking-widest h-12 shadow-xl"
                            onClick={() => navigate('/dashboard')}
                        >
                            Return to Dashboard
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!exam) {
        return <div className="min-h-screen flex items-center justify-center">Exam not found.</div>;
    }

    if (isBrave) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 select-none">
                <div className="bg-slate-800 rounded-3xl p-8 max-w-lg w-full text-center border border-red-500/30 shadow-2xl">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-black text-white uppercase mb-2">Browser Not Supported</h1>
                    <p className="text-slate-300 mb-6 font-medium leading-relaxed">
                        The Brave browser is strictly prohibited for taking exams. Brave's aggressive privacy shields block Canvas Fingerprinting APIs, which completely disables our AI Proctoring face detection system.
                    </p>
                    <p className="text-amber-400 text-sm font-bold bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner">
                        Please log out and switch to Google Chrome, Mozilla Firefox, or Microsoft Edge to continue.
                    </p>
                </div>
            </div>
        );
    }

    if (!isChrome) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none">
                <ShieldAlert className="h-20 w-20 text-red-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">{t('exam.unsupported_browser')}</h1>
                <p className="text-slate-400 max-w-md mb-8">
                    {t('exam.browser_desc')}
                </p>
                <Button variant="primary" onClick={() => navigate('/dashboard')} className="bg-white text-black hover:bg-slate-200">
                    {t('exam.return_hub')}
                </Button>
            </div>
        );
    }

    // ==== VIRTUAL EXAM HALL ====
    // The standalone instructions stage has been merged into the Virtual Exam Hall as its final step.
    // Both 'instructions' (legacy/edge-case) and 'hall' stages now render VirtualExamHall.
    if (examStage === 'hall' || examStage === 'instructions') {
        return (
            <VirtualExamHall
                examTitle={exam.title}
                examStartTime={exam.startTime}
                requireIdCapture={!hasIdCard}
                description={exam.description}
                duration={exam.duration}
                questionsCount={exam.questions?.length}
                violationThreshold={exam.proctoringConfig?.violationThreshold || 5}
                onComplete={async (idData) => {
                    // Store shared stream for BehavioralProctor to reuse
                    if (idData.stream) {
                        sharedStreamRef.current = idData.stream;
                    }
                    // Save ID Capture data to session
                    if (examId && (idData.idCardFront || idData.idCardBack)) {
                        try {
                            setSyncStatus('syncing');
                            await updateExamProgress(examId, exam?.isAdaptive ? undefined : answersRef.current, timeSpentRef.current, flaggedRef.current, idData.idCardFront, idData.idCardBack);
                            setSyncStatus('saved');
                        } catch (err) {
                            console.error('Failed to save ID capture:', err);
                            setSyncStatus('error');
                        }
                    }
                    unlockAudio(); // Unlock audio on transition to active stage
                    setExamStage('active');
                }}
            />
        );
    }

    // ==== ADAPTIVE EXAM MODE (C.A.T.) ====
    if (exam.isAdaptive && sessionInitialized) {
        return (
            <>
                {/* AI Behavioral Proctoring for Adaptive Mode */}
                <BehavioralProctor
                    onViolation={triggerAlert}
                    isActive={!isSuspended && examStage === 'active' && !isViolationPaused}
                    enabled={true}
                    existingStream={sharedStreamRef.current}
                    enableFaceDetection={exam.proctoringConfig?.enableFaceDetection ?? true}
                    enableVoiceDetection={exam.proctoringConfig?.enableVoiceDetection ?? true}
                    enableGazeTracking={exam.proctoringConfig?.enableGazeTracking}
                />
                <AdaptiveExamView
                    examId={examId!}
                    examTitle={exam.title}
                    timeLeft={timeLeft}
                    navigate={navigate}
                    violationCount={violationCount}
                    showCheatWarning={showCheatWarning}
                    syncStatus={syncStatus}
                    socketConnected={socketConnected}
                    setSyncStatus={setSyncStatus}
                    formatTime={formatTime}
                    isPausedRef={isPausedRef}
                    submittingRef={submittingRef}
                />
            </>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden select-none">
            {/* AI Behavioral Proctoring (Audio/Video Monitoring) */}
            <BehavioralProctor
                onViolation={triggerAlert}
                isActive={!isSuspended && examStage === 'active' && !isViolationPaused}
                enabled={true}
                existingStream={sharedStreamRef.current}
                enableFaceDetection={exam.proctoringConfig?.enableFaceDetection ?? true}
                enableVoiceDetection={exam.proctoringConfig?.enableVoiceDetection ?? true}
                enableGazeTracking={exam.proctoringConfig?.enableGazeTracking}
            />
            {/* Offline Banner */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-600 text-white px-6 py-2 flex items-center justify-center gap-3 z-50 text-xs font-bold"
                    >
                        <WifiOff className="h-4 w-4" />
                        <span>{t('exam.offline')}</span>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    {syncStatus === 'syncing' ? t('exam.syncing') : syncStatus === 'error' ? 'Sync Error' : t('exam.saved')}
                                </span>
                            </div>
                            <div className="w-px h-2 bg-slate-200 dark:bg-slate-800"></div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${isOnline && socketConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}>
                                    {isOnline ? null : <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline && socketConnected ? 'text-gray-400' : 'text-red-500 font-black'}`}>
                                    {isOnline && socketConnected ? t('exam.live_connection') : t('exam.disconnected')}
                                </span>
                                {!isOnline && <WifiOff className="h-3 w-3 text-red-500 ml-1" />}
                            </div>
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
                            {t('exam.go_fullscreen')}
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
                                        <span>{t('exam.sidebar.current')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50"></div>
                                        <span>{t('exam.sidebar.answered')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                        <div className="h-3 w-3 rounded-full bg-gray-100 dark:bg-slate-800"></div>
                                        <span>{t('exam.sidebar.unanswered')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                                        <Flag className="h-3 w-3 text-warning fill-warning" />
                                        <span>{t('exam.sidebar.flagged')}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-8 mt-8">
                                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="text-2xl font-black text-primary dark:text-blue-400">{Object.keys(answers).length}</div>
                                        <div className="text-[10px] font-black text-primary/60 dark:text-blue-400/60 uppercase tracking-widest">{t('exam.sidebar.attempted')}</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                        <div className="text-2xl font-black text-gray-900 dark:text-slate-100">{exam.questions.length - Object.keys(answers).length}</div>
                                        <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{t('exam.sidebar.remaining')}</div>
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
                                        {t('exam.question_n_of_m', { n: currentQuestionIndex + 1, m: exam.questions.length })}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-50 mt-2 leading-relaxed">
                                        {currentQuestion.text}
                                    </h2>
                                    {/* Question image – responsive, aspect-ratio preserved */}
                                    {(currentQuestion as any).imageUrl && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                            <img
                                                src={`${(import.meta as any).env?.VITE_API_URL ?? getApiUrl()}${(currentQuestion as any).imageUrl}`}
                                                alt="Question visual"
                                                className="w-full max-h-[35vh] object-contain block"
                                            />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleFlag(currentQuestion._id)}
                                    className={`p-2.5 rounded-xl transition-all duration-300 ${flagged[currentQuestion._id]
                                        ? 'bg-warning/20 text-warning ring-2 ring-warning/50'
                                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    title={t('exam.mark_review')}
                                >
                                    <Flag className={`h-6 w-6 ${flagged[currentQuestion._id] ? 'fill-warning' : ''}`} />
                                </button>
                            </div>

                            {/* Options */}
                            <div className="space-y-4 flex-1">
                                {currentQuestion.type === 'descriptive' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>{t('exam.theoretical_response')}</span>
                                            <span>{t('exam.auto_saving')}</span>
                                        </div>
                                        <textarea
                                            value={answers[currentQuestion._id] || ''}
                                            onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                                            placeholder={t('exam.descriptive_placeholder')}
                                            className="w-full h-72 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-primary outline-none transition-all resize-none shadow-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 select-text"
                                        />
                                        <div className="flex justify-between items-center px-1">
                                            <p className="text-[10px] text-slate-400">{t('exam.char_count')}: {(answers[currentQuestion._id] || '').length}</p>
                                            <p className="text-[10px] text-slate-400 italic">{t('exam.ai_eval_note')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    (currentQuestion.options || []).map((option: string, index: number) => {
                                        const optionImg = (currentQuestion as any).optionImages?.[index];
                                        return (
                                            <label
                                                key={index}
                                                className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQuestion._id] === index
                                                    ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10'
                                                    : 'border-[var(--border-main)] hover:border-primary/50 hover:bg-[var(--bg-main)]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name={`question-${currentQuestion._id}`}
                                                        value={index}
                                                        checked={answers[currentQuestion._id] === index}
                                                        onChange={() => handleAnswerSelect(currentQuestion._id, index)}
                                                        className="h-5 w-5 text-primary border-gray-300 dark:border-slate-700 focus:ring-primary bg-white dark:bg-slate-950 flex-shrink-0"
                                                    />
                                                    {option && (
                                                        <span className={`text-lg ${answers[currentQuestion._id] === index ? 'text-primary dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-slate-300'}`}>
                                                            {option}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Option image – responsive with aspect-ratio preserved */}
                                                {optionImg && (
                                                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                                        <img
                                                            src={`${(import.meta as any).env?.VITE_API_URL ?? getApiUrl()}${optionImg}`}
                                                            alt={`Option ${String.fromCharCode(65 + index)}`}
                                                            className="w-full max-h-[25vh] object-contain block"
                                                        />
                                                    </div>
                                                )}
                                            </label>
                                        );
                                    })
                                )}
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
                                <ChevronLeft className="h-5 w-5" /> {t('exam.prev')}
                            </Button>

                            {currentQuestionIndex === exam.questions.length - 1 ? (
                                <Button
                                    variant="success"
                                    className="gap-2"
                                    onClick={() => {
                                        isPausedRef.current = true; // Pause proctoring immediately on opening modal
                                        setShowSubmitModal(true);
                                    }}
                                >
                                    {t('exam.submit')}
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={() => handleQuestionChange(Math.min(exam.questions.length - 1, currentQuestionIndex + 1))}
                                    className="gap-2"
                                >
                                    {t('exam.next')} <ChevronRight className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </main>
            </div>


            {/* DRM Watermark Overlay to prevent screen-recording */}
            <WatermarkOverlay />

            {/* Cheating Warning Overlay */}
            <AnimatePresence>
                {
                    showCheatWarning && (
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
                                <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest font-bold">{t('exam.violation_audit', { count: violationCount })}</p>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Violation Pause Lockout Overlay */}
            <AnimatePresence>
                {
                    isViolationPaused && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
                        >
                            <div className="max-w-md w-full">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-4 border-red-500 shadow-2xl flex flex-col items-center"
                                >
                                    <div className="h-20 w-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                        <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                                    </div>

                                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter mb-2">
                                        EXAM HALTED
                                    </h2>
                                    <p className="text-red-600 dark:text-red-400 font-bold mb-8 uppercase tracking-widest text-xs">
                                        UNFAIR MEANS DETECTED
                                    </p>

                                    <div className="text-6xl font-black text-slate-900 dark:text-slate-100 mb-8 tabular-nums">
                                        {pauseCountdown}s
                                    </div>

                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-left w-full space-y-2">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Protocol Recovery Initiated</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-bold italic">
                                            "{violationAlertMessage || 'Please stay within the exam window and remain in fullscreen mode. This incident has been recorded.'}"
                                        </p>
                                    </div>

                                    <div className="mt-8 flex flex-col items-center gap-4 w-full">
                                        {pauseCountdown > 0 ? (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Checking Anti-Cheating Environment...</span>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                className="w-full py-4 text-lg font-black uppercase tracking-tighter"
                                                onClick={() => {
                                                    isPausedRef.current = false;
                                                    setIsViolationPaused(false);
                                                    if (examRef.current?.proctoringConfig?.enableFullscreen) {
                                                        enterFullscreen();
                                                    }
                                                    unlockAudio();
                                                }}
                                            >
                                                Resume Exam
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Intercom Message Overlay */}
            <AnimatePresence>
                {activeIntercomAlert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border-2 border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col items-center"
                        >
                            <div className="h-16 w-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="h-8 w-8 text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Message from {activeIntercomAlert.sender}</h2>
                            <div className="bg-slate-800 rounded-xl p-4 w-full mb-8">
                                <p className="text-slate-200 font-medium italic">"{activeIntercomAlert.message}"</p>
                            </div>
                            <Button
                                variant="primary"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 uppercase tracking-widest text-xs h-12 rounded-xl"
                                onClick={() => setActiveIntercomAlert(null)}
                            >
                                Acknowledge
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Non-Punitive Fullscreen Enforcement for Waiting Hall */}
            <AnimatePresence>
                {
                    showFullscreenLock && !isViolationPaused && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[250] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center"
                        >
                            <div className="max-w-lg w-full">
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="bg-slate-900 rounded-3xl p-8 border border-slate-700 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

                                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
                                        <MonitorOff className="w-10 h-10 text-slate-300" />
                                    </div>

                                    <h2 className="text-2xl font-black text-white tracking-tight mb-3">Fullscreen Required</h2>
                                    <p className="text-slate-400 mb-8 leading-relaxed">
                                        Your examination environment requires fullscreen mode to ensure integrity. Please return to fullscreen to continue {examStageRef.current === 'active' ? 'your exam' : 'waiting in the virtual hall'}.
                                    </p>

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full gap-3 h-14 text-lg font-bold shadow-lg shadow-blue-500/20"
                                        onClick={() => {
                                            enterFullscreen();
                                            setShowFullscreenLock(false);
                                        }}
                                    >
                                        <MonitorOff className="w-5 h-5" /> Return to Fullscreen
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Non-Punitive Fullscreen Enforcement for Waiting Hall */}
            <AnimatePresence>
                {
                    showFullscreenLock && !isViolationPaused && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[250] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center"
                        >
                            <div className="max-w-lg w-full">
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="bg-slate-900 rounded-3xl p-8 border border-slate-700 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

                                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
                                        <MonitorOff className="w-10 h-10 text-slate-300" />
                                    </div>

                                    <h2 className="text-2xl font-black text-white tracking-tight mb-3">Fullscreen Required</h2>
                                    <p className="text-slate-400 mb-8 leading-relaxed">
                                        Your examination environment requires fullscreen mode to ensure integrity. Please return to fullscreen to continue {examStageRef.current === 'active' ? 'your exam' : 'waiting in the virtual hall'}.
                                    </p>

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full gap-3 h-14 text-lg font-bold shadow-lg shadow-blue-500/20"
                                        onClick={() => {
                                            enterFullscreen();
                                            setShowFullscreenLock(false);
                                        }}
                                    >
                                        <MonitorOff className="w-5 h-5" /> Return to Fullscreen
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence>

            {/* Submit Confirmation Modal */}
            <AnimatePresence>
                {
                    showSubmitModal && (
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
                                            onClick={() => {
                                                setShowSubmitModal(false);
                                                isPausedRef.current = false; // Resume proctoring if cancelled
                                            }}
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
                    )
                }
            </AnimatePresence >
        </div >
    );
}
