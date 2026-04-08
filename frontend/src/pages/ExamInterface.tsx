import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { ShieldAlert, AlertCircle, WifiOff, X, Flag, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getExamById, submitExam, startExamSession, updateExamProgress, logViolation } from '../services/examService';
import { getSocket, joinExamRoom, leaveExamRoom, emitExamStart, emitExamSubmit, onExamClosedManually, emitProctorAlert, onStudentSuspended, onStudentUnsuspended, onIntercomMessage } from '../services/socket';
import { getCurrentUser } from '../services/authService';
import { getOfflineProgress, saveProgressOffline, clearOfflineProgress } from '../services/offlineSyncService';
import WatermarkOverlay from '../components/exam/WatermarkOverlay';
import BehavioralProctor from '../components/exam/BehavioralProctor';
import VirtualExamHall from '../components/exam/VirtualExamHall';
import { isBraveBrowser } from '../utils/browserDetection';
import { ExamHeader } from '../components/exam/ExamHeader';
import { AdaptiveExamView } from '../components/exam/AdaptiveExamView';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExamInterface() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    
    // State
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
    const [sessionInitialized, setSessionInitialized] = useState(false);
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);
    const [examStage, setExamStage] = useState<'loading' | 'instructions' | 'hall' | 'active'>('loading');
    const [activeIntercomAlert, setActiveIntercomAlert] = useState<{ message: string; sender: string } | null>(null);
    const [hasIdCard, setHasIdCard] = useState(false);

    // Refs
    const isPausedRef = useRef(false);
    const submittingRef = useRef(false);
    const examRef = useRef<any>(null);
    const violationCountRef = useRef(0);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastViolationTimeRef = useRef<number>(0);
    const mouseLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const examStageRef = useRef(examStage);
    const sharedStreamRef = useRef<MediaStream | null>(null);
    const answersRef = useRef(answers);
    const flaggedRef = useRef(flagged);
    const timeSpentRef = useRef(questionTimeSpent);
    const [showFullscreenLock, setShowFullscreenLock] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const alertBufferRef = useRef<AudioBuffer | null>(null);

    // Sync Refs
    useEffect(() => { examRef.current = exam; }, [exam]);
    useEffect(() => { violationCountRef.current = violationCount; }, [violationCount]);
    useEffect(() => { submittingRef.current = submitting; }, [submitting]);
    useEffect(() => { examStageRef.current = examStage; }, [examStage]);
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { flaggedRef.current = flagged; }, [flagged]);
    useEffect(() => { timeSpentRef.current = questionTimeSpent; }, [questionTimeSpent]);

    // Helpers
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const updateTimeSpent = useCallback(() => {
        if (!exam || !exam.questions[currentQuestionIndex]) return;
        const qId = exam.questions[currentQuestionIndex]._id;
        const now = Date.now();
        const elapsed = Math.floor((now - currentQuestionStartTime) / 1000);

        setQuestionTimeSpent(prev => {
            const next = { ...prev, [qId]: (prev[qId] || 0) + elapsed };
            timeSpentRef.current = next;
            if (examId) saveProgressOffline(examId, answersRef.current, next, flaggedRef.current);
            return next;
        });
        setCurrentQuestionStartTime(now);
    }, [exam, currentQuestionIndex, currentQuestionStartTime, examId]);

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

    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedSync = useCallback(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setSyncStatus('syncing');
        syncTimeoutRef.current = setTimeout(performSync, 2000);
    }, [performSync]);

    const handleSubmit = useCallback(async () => {
        if (submittingRef.current) return;
        setSubmitting(true);
        submittingRef.current = true;
        isPausedRef.current = true;

        try {
            const formattedAnswers = Object.entries(answersRef.current).map(([qId, val]) => {
                const q = examRef.current.questions.find((q: any) => q._id === qId);
                return {
                    questionId: qId,
                    selectedOption: q?.type === 'mcq' ? (typeof val === 'number' ? val : undefined) : undefined,
                    textAnswer: q?.type === 'descriptive' ? (typeof val === 'string' ? val : undefined) : undefined,
                    timeSpent: timeSpentRef.current[qId] || 0
                };
            });

            if (examId) {
                await submitExam(examId, formattedAnswers);
                clearOfflineProgress(examId);
                const user = getCurrentUser();
                if (user && user._id) emitExamSubmit(examId, user._id);
                alert('Exam submitted successfully.');
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
    }, [examId, navigate]);

    // Audio Logic
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
            } catch (err) { console.warn('Failed to pre-load sound:', err); }
        };
        loadSound();
        return () => { if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close(); };
    }, []);

    const playAlert = useCallback(() => {
        const ctx = audioContextRef.current;
        const buffer = alertBufferRef.current;
        if (!ctx || !buffer) return;
        if (ctx.state === 'suspended') ctx.resume();
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
                setShowFullscreenLock(true);
            });
        }
    }, []);

    const triggerAlert = useCallback(async (type: string, message: string, evidence?: { snapshot?: string, transcript?: string }) => {
        if (isPausedRef.current || submittingRef.current || isSuspended || !examId || examStageRef.current !== 'active') return;
        const now = Date.now();
        if (now - lastViolationTimeRef.current < 2500) return;
        lastViolationTimeRef.current = now;
        isPausedRef.current = true;
        setPauseCountdown(5);
        setIsViolationPaused(true);
        playAlert();

        const currentCount = violationCountRef.current + 1;
        setViolationCount(currentCount);
        const threshold = examRef.current?.proctoringConfig?.violationThreshold || 5;
        const chancesLeft = Math.max(0, threshold - currentCount);

        setShowCheatWarning(`${message} | ${chancesLeft > 0 ? `Warning: ${chancesLeft} chances remaining.` : 'CRITICAL: Threshold reached.'}`);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setShowCheatWarning(null), 6000);

        if (examId) {
            const user = getCurrentUser();
            if (user?._id) {
                emitProctorAlert(examId!, user._id, user.name, user.rollNo || 'N/A', type, message, evidence?.snapshot, evidence?.transcript);
                try {
                    const result = await logViolation(examId, { type, message, snapshot: evidence?.snapshot, transcript: evidence?.transcript });
                    if (result.isSuspended || chancesLeft <= 0) {
                        setIsSuspended(true);
                        setSuspensionReason(`Suspended due to ${currentCount} violations.`);
                        await handleSubmit();
                        emitExamSubmit(examId, user._id);
                    }
                } catch (err) { console.error('Violation logging failed:', err); }
            }
        }
    }, [examId, isSuspended, playAlert, handleSubmit]);

    // Effects
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

    useEffect(() => {
        const checkBrave = async () => setIsBrave(await isBraveBrowser());
        checkBrave();
        const isChromium = !!(window as any).chrome;
        const isIOSChrome = /CriOS/.test(navigator.userAgent);
        setIsChrome(isChromium || isIOSChrome);
    }, []);

    useEffect(() => {
        if (!examId) return;
        const socket = getSocket();
        setSocketConnected(socket.connected);
        socket.on('connect', () => setSocketConnected(true));
        socket.on('disconnect', () => setSocketConnected(false));
        joinExamRoom(examId);
        const user = getCurrentUser();
        if (user && user._id) emitExamStart(examId, user._id);
        
        const cleanupManual = onExamClosedManually(({ examId: closedId }) => {
            if (closedId === examId) { alert(t('exam.session_closed')); handleSubmit(); }
        });
        const cleanupSuspended = onStudentSuspended((data: any) => {
            if (data.examId === examId && data.studentId === user?._id) {
                setIsSuspended(true);
                setSuspensionReason(data.reason || 'Violations detected.');
            }
        });
        const cleanupUnsuspended = onStudentUnsuspended((data: any) => {
            if (data.examId === examId && data.studentId === user?._id) {
                setIsSuspended(false);
                setSuspensionReason('');
                setRefreshTrigger(p => p + 1);
                alert(data.message || 'Resumed.');
            }
        });
        const cleanupIntercom = onIntercomMessage((data) => {
            if (data.studentId === user?._id) {
                playAlert();
                setActiveIntercomAlert({ message: data.message, sender: data.sender });
            }
        });

        return () => {
            cleanupManual(); cleanupSuspended(); cleanupUnsuspended(); cleanupIntercom();
            leaveExamRoom(examId);
        };
    }, [examId, handleSubmit, t, playAlert]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isViolationPaused && pauseCountdown > 0) {
            interval = setInterval(() => {
                setPauseCountdown(p => {
                    if (p <= 1) {
                        setIsViolationPaused(false);
                        isPausedRef.current = false;
                        return 0;
                    }
                    return p - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isViolationPaused, pauseCountdown]);

    useEffect(() => {
        const fetchData = async () => {
            if (!examId) return;
            try {
                const data = await getExamById(examId);
                setExam(data);
                const session = await startExamSession(examId);
                setHasIdCard(!!session.idCardFront);
                const offline = getOfflineProgress(examId);
                let a = session.answers || {}, f = session.flagged || {}, ts = session.timeSpent || {};
                if (offline) {
                    if (Object.keys(offline.answers).length >= Object.keys(a).length) a = { ...a, ...offline.answers };
                    f = { ...f, ...offline.flagged }; ts = { ...ts, ...offline.timeSpent };
                }
                setAnswers(a); setFlagged(f); setQuestionTimeSpent(ts); setViolationCount(session.violationCount || 0);
                let rem = data.duration * 60 - Object.values(ts).reduce((acc: number, c: any) => acc + (c || 0), 0);
                const serverNow = new Date(session.serverTime).getTime();
                const examEnd = new Date(data.endTime).getTime();
                rem = Math.min(rem, Math.max(0, Math.floor((examEnd - serverNow) / 1000)));
                setTimeLeft(rem); setSessionInitialized(true);
                if (rem <= 0) { alert('Time expired.'); navigate('/dashboard'); }
            } catch (err: any) {
                if (err.response?.data?.isSuspended) { setIsSuspended(true); setSuspensionReason(err.response.data.message); }
                else { alert(err.response?.data?.message || 'Error'); navigate('/dashboard'); }
            } finally { if (!isSuspended) { setLoading(false); setExamStage('hall'); } }
        };
        fetchData();
    }, [examId, navigate, refreshTrigger, isSuspended]);

    useEffect(() => {
        if (!exam || !examId) return;
        const timer = setInterval(() => {
            if (submittingRef.current) { clearInterval(timer); return; }
            if (examStageRef.current !== 'active') return;
            setTimeLeft(p => {
                if (p <= 1) { clearInterval(timer); handleSubmit(); return 0; }
                return p - 1;
            });
        }, 1000);
        const syncInt = setInterval(() => {
            if (syncStatus !== 'syncing') {
                updateTimeSpent();
                updateExamProgress(examId, exam?.isAdaptive ? undefined : answersRef.current, timeSpentRef.current, flaggedRef.current).catch(console.error);
            }
        }, 30000);
        return () => { clearInterval(timer); clearInterval(syncInt); };
    }, [examId, exam, updateTimeSpent, handleSubmit, syncStatus]);

    useEffect(() => {
        if (loading || !exam) return;
        const config = exam.proctoringConfig || { enableTabLock: true, enableFullscreen: true, enableInputLock: true };
        const hVis = () => { if (config.enableTabLock && document.hidden) setTimeout(() => { if (document.hidden && !isPausedRef.current) triggerAlert('Tab Switched', 'Forbidden.'); }, 100); };
        const hBlur = () => { if (config.enableTabLock) setTimeout(() => { if (!document.hasFocus() && !isPausedRef.current) triggerAlert('Window Blur', 'Focus lost.'); }, 500); };
        const hFull = () => { 
            if (config.enableFullscreen && !document.fullscreenElement) {
                if (examStageRef.current === 'active' && !isViolationPaused) triggerAlert('Fullscreen Exit', 'Required.');
                else setShowFullscreenLock(true);
            } else setShowFullscreenLock(false);
        };
        const hCtx = (e: MouseEvent) => { if (config.enableInputLock) { e.preventDefault(); triggerAlert('Right Click', 'Forbidden.'); } };
        const hKey = (e: KeyboardEvent) => {
            if (!config.enableInputLock) return;
            if (['F12', 'PrintScreen', 'Meta'].includes(e.key) || ((e.ctrlKey || e.metaKey) && 'cvuipsja'.includes(e.key.toLowerCase()))) {
                e.preventDefault(); triggerAlert('Keyboard Shortcut', `Forbidden: ${e.key}`);
            }
        };
        const hCP = (e: ClipboardEvent) => { if (config.enableInputLock) { e.preventDefault(); triggerAlert('Clipboard', 'Forbidden.'); } };
        const hML = () => { if (config.enableTabLock) { mouseLeaveTimeoutRef.current = setTimeout(() => { if (!isPausedRef.current) triggerAlert('Cursor Out', 'Forbidden.'); }, 750); } };
        const hME = () => { if (mouseLeaveTimeoutRef.current) { clearTimeout(mouseLeaveTimeoutRef.current); mouseLeaveTimeoutRef.current = null; } };

        window.addEventListener('visibilitychange', hVis); window.addEventListener('blur', hBlur);
        document.addEventListener('fullscreenchange', hFull); window.addEventListener('contextmenu', hCtx);
        window.addEventListener('keydown', hKey); window.addEventListener('copy', hCP); window.addEventListener('paste', hCP);
        document.addEventListener('mouseleave', hML); document.addEventListener('mouseenter', hME); document.addEventListener('mousemove', hME);
        return () => {
            window.removeEventListener('visibilitychange', hVis); window.removeEventListener('blur', hBlur);
            document.removeEventListener('fullscreenchange', hFull); window.removeEventListener('contextmenu', hCtx);
            window.removeEventListener('keydown', hKey); window.removeEventListener('copy', hCP); window.removeEventListener('paste', hCP);
            document.removeEventListener('mouseleave', hML); document.removeEventListener('mouseenter', hME); document.removeEventListener('mousemove', hME);
        };
    }, [loading, exam, triggerAlert, isViolationPaused]);

    const handleAnswerSelect = (qid: string, val: any) => {
        setAnswers(p => { 
            const n = { ...p, [qid]: val }; answersRef.current = n;
            if (examId) saveProgressOffline(examId, n, timeSpentRef.current, flaggedRef.current);
            debouncedSync(); return n;
        });
    };
    const handleQuestionChange = (i: number) => { updateTimeSpent(); setCurrentQuestionIndex(i); if (window.innerWidth < 1024) setIsSidebarOpen(false); };
    const toggleFlag = (qid: string) => {
        setFlagged(p => {
            const n = { ...p, [qid]: !p[qid] }; flaggedRef.current = n;
            if (examId) saveProgressOffline(examId, answersRef.current, timeSpentRef.current, n);
            debouncedSync(); return n;
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (isSuspended) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-4 border-red-500/50">
                <ShieldAlert className="h-10 w-10 text-red-600 mx-auto mb-6" />
                <h1 className="text-3xl font-black mb-4">Access Revoked</h1>
                <p className="text-red-700 italic mb-8">"{suspensionReason}"</p>
                <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            </div>
        </div>
    );
    if (!exam) return <div>Not found.</div>;
    if (isBrave) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">Brave browser not supported.</div>;
    if (!isChrome) return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">Please use Chrome or Edge.</div>;

    if (examStage === 'hall' || examStage === 'instructions') {
        return (
            <VirtualExamHall
                examTitle={exam.title} examStartTime={exam.startTime} requireIdCapture={!hasIdCard}
                description={exam.description} duration={exam.duration} questionsCount={exam.questions?.length}
                violationThreshold={exam.proctoringConfig?.violationThreshold || 5}
                onComplete={async (data) => {
                    if (data.stream) sharedStreamRef.current = data.stream;
                    if (examId && (data.idCardFront || data.idCardBack)) {
                        await updateExamProgress(examId, exam.isAdaptive ? undefined : answersRef.current, timeSpentRef.current, flaggedRef.current, data.idCardFront, data.idCardBack);
                    }
                    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
                    
                    setExamStage('active');
                    if (exam?.proctoringConfig?.enableFullscreen) {
                        setTimeout(enterFullscreen, 1000);
                    }
                }}
            />
        );
    }

    if (exam.isAdaptive && sessionInitialized) {
        return (
            <>
                <BehavioralProctor
                    onViolation={triggerAlert} isActive={!isSuspended && examStage === 'active' && !isViolationPaused}
                    enabled={true} existingStream={sharedStreamRef.current}
                    enableFaceDetection={exam.proctoringConfig?.enableFaceDetection ?? true}
                    enableVoiceDetection={exam.proctoringConfig?.enableVoiceDetection ?? true}
                />
                <AdaptiveExamView
                    examId={examId!} examTitle={exam.title} timeLeft={timeLeft} navigate={navigate}
                    violationCount={violationCount} syncStatus={syncStatus}
                    socketConnected={socketConnected} setSyncStatus={setSyncStatus} formatTime={formatTime}
                    isPausedRef={isPausedRef} submittingRef={submittingRef} t={t}
                />
            </>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden select-none">
            <BehavioralProctor
                onViolation={triggerAlert} isActive={!isSuspended && examStage === 'active' && !isViolationPaused}
                enabled={true} existingStream={sharedStreamRef.current}
                enableFaceDetection={exam.proctoringConfig?.enableFaceDetection ?? true}
                enableVoiceDetection={exam.proctoringConfig?.enableVoiceDetection ?? true}
            />
            <AnimatePresence>
                {!isOnline && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-red-600 text-white py-2 text-center text-xs font-bold">
                        <WifiOff className="h-4 w-4 inline mr-2" /> Offline Mode
                    </motion.div>
                )}
            </AnimatePresence>

            <ExamHeader
                title={exam.title}
                timeLeft={timeLeft}
                formatTime={formatTime}
                syncStatus={syncStatus}
                isOnline={isOnline}
                socketConnected={socketConnected}
                violationCount={violationCount}
                onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onFinish={() => setShowSubmitModal(true)}
                onFullscreen={enterFullscreen}
                showFullscreenButton={!document.fullscreenElement && (exam.proctoringConfig?.enableFullscreen ?? true)}
                submitting={submitting}
                t={t}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <AnimatePresence>
                    {(isSidebarOpen || window.innerWidth >= 1024) && (
                        <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`absolute lg:relative z-10 w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col ${!isSidebarOpen && 'hidden lg:flex'}`}>
                            <div className="p-4 border-b lg:hidden flex justify-between items-center">
                                <span className="font-bold">Navigator</span>
                                <button onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-4 gap-3">
                                    {exam.questions.map((q: any, idx: number) => (
                                        <button key={q._id} onClick={() => handleQuestionChange(idx)} className={`relative h-10 w-10 rounded-lg font-medium text-sm flex items-center justify-center ${currentQuestionIndex === idx ? 'bg-blue-600 text-white' : answers[q._id] !== undefined ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {idx + 1}
                                            {flagged[q._id] && <Flag className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                            <div className="flex justify-between mb-6">
                                <h2 className="text-xl font-bold">{currentQuestionIndex + 1}. {currentQuestion.text}</h2>
                                <button onClick={() => toggleFlag(currentQuestion._id)} className={`p-2 rounded-lg ${flagged[currentQuestion._id] ? 'bg-amber-100 text-amber-600' : 'text-slate-400'}`}>
                                    <Flag className={`h-6 w-6 ${flagged[currentQuestion._id] ? 'fill-amber-500' : ''}`} />
                                </button>
                            </div>
                            {currentQuestion.type === 'descriptive' ? (
                                <textarea
                                    value={answers[currentQuestion._id] || ''}
                                    onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                                    className="w-full h-72 p-6 bg-white dark:bg-slate-950 border-2 rounded-2xl outline-none"
                                />
                            ) : (
                                <div className="space-y-3">
                                    {(currentQuestion.options || []).map((o: string, index: number) => (
                                        <label key={index} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${answers[currentQuestion._id] === index ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200'}`}>
                                            <input type="radio" checked={answers[currentQuestion._id] === index} onChange={() => handleAnswerSelect(currentQuestion._id, index)} className="h-5 w-5" />
                                            <span>{o}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between mt-8">
                            <Button variant="outline" onClick={() => handleQuestionChange(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}><ChevronLeft /> Prev</Button>
                            {currentQuestionIndex === exam.questions.length - 1 ? (
                                <Button variant="primary" onClick={() => setShowSubmitModal(true)}>Finish</Button>
                            ) : (
                                <Button variant="primary" onClick={() => handleQuestionChange(currentQuestionIndex + 1)}>Next <ChevronRight /></Button>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <BehavioralProctor
                enabled={!!exam?.proctoringConfig?.enableAIVideo}
                isActive={examStage === 'active' && !isViolationPaused && !isSuspended}
                onViolation={triggerAlert}
                enableFaceDetection={!!exam?.proctoringConfig?.enableAIVideo}
                enableVoiceDetection={!!exam?.proctoringConfig?.enableAIVideo}
                enableGazeTracking={!!exam?.proctoringConfig?.enableGazeTracking}
                performanceSettings={{
                    violationCooldownMs: 15000
                }}
            />

            <WatermarkOverlay />
            <AnimatePresence>
                {showCheatWarning && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-4 rounded-xl flex items-center gap-4">
                        <AlertCircle className="h-8 w-8" />
                        <div><p className="font-bold">{showCheatWarning.split(' | ')[0]}</p><p className="text-xs">{showCheatWarning.split(' | ')[1]}</p></div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isViolationPaused && (
                    <div className="fixed inset-0 z-[200] bg-slate-950/90 flex items-center justify-center p-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-4 border-red-500 text-center max-w-md">
                            <ShieldAlert className="h-10 w-10 text-red-600 mx-auto mb-4" />
                            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Halted</h2>
                            <p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2">Unauthorized activity detected</p>
                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-6">
                                <p className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                    {showCheatWarning?.split(' | ')[0] || 'Verification required'}
                                </p>
                            </div>
                            <div className="text-6xl font-black mb-8 font-mono">{pauseCountdown}s</div>
                            {pauseCountdown <= 0 && <Button variant="primary" className="w-full py-6 text-lg font-black uppercase tracking-widest" onClick={() => { setIsViolationPaused(false); isPausedRef.current = false; if (exam.proctoringConfig?.enableFullscreen) enterFullscreen(); }}>Acknowledge & Resume</Button>}
                        </div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {activeIntercomAlert && (
                    <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-6 text-center">
                        <div className="bg-slate-900 p-8 rounded-3xl border-2 border-indigo-500">
                            <MessageSquare className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
                            <h2 className="text-white font-bold mb-4">Message from {activeIntercomAlert.sender}</h2>
                            <p className="text-slate-300 italic mb-8">"{activeIntercomAlert.message}"</p>
                            <Button onClick={() => setActiveIntercomAlert(null)}>Acknowledge</Button>
                        </div>
                    </div>
                )}
            </AnimatePresence>
            {showFullscreenLock && (
                <div className="fixed inset-0 z-[250] bg-slate-950 flex items-center justify-center text-center p-6">
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700">
                        <h2 className="text-white text-2xl font-black mb-4">Fullscreen Required</h2>
                        <Button onClick={() => { enterFullscreen(); setShowFullscreenLock(false); }}>Enable Fullscreen</Button>
                    </div>
                </div>
            )}
            <AnimatePresence>
                {showSubmitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-center">
                            <h3 className="text-xl font-bold mb-4">Submit Exam?</h3>
                            <p className="mb-6">Answered {Object.keys(answers).length} / {exam.questions.length}</p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit}>Confirm</Button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
