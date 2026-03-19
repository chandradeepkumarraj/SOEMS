import { useState, useEffect, useRef, useCallback } from 'react'; // Refreshed: 2026-03-15T02:25:00Z
import { Button } from '../ui/Button';
import { Camera, Mic, Wifi, ShieldCheck, CreditCard, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, Clock, Sparkles, BookOpen, FileText, Timer, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isBraveBrowser } from '../../utils/browserDetection';

interface VirtualExamHallProps {
    onComplete: (idData: { idCardFront: string | undefined; idCardBack: string | undefined; stream: MediaStream | null }) => void;
    examTitle: string;
    /** ISO string of the exam's scheduled start time. Used for early-entry countdown. */
    examStartTime?: string;
    /** Whether the user needs to complete the ID capture step (default: true). Set to false on resume. */
    requireIdCapture?: boolean;
    /** Exam description / instructions text from the teacher */
    description?: string;
    /** Exam duration in minutes */
    duration?: number;
    /** Total number of questions */
    questionsCount?: number;
    /** Maximum violations allowed before auto-suspension */
    violationThreshold?: number;
}

const VirtualExamHall = ({ onComplete, examTitle, examStartTime, requireIdCapture = true, description, duration, questionsCount, violationThreshold = 5 }: VirtualExamHallProps) => {
    const [stepId, setStepId] = useState<'hardware' | 'connectivity' | 'id-capture' | 'instructions'>('hardware');
    const [checks, setChecks] = useState({
        camera: false,
        mic: false,
        internet: false
    });
    const [idCards, setIdCards] = useState<{ front: string | undefined; back: string | undefined }>({
        front: undefined,
        back: undefined
    });
    const [capturingSide, setCapturingSide] = useState<'front' | 'back' | null>(null);
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);
    const [latency, setLatency] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isExamReady, setIsExamReady] = useState(false);
    const [isBrave, setIsBrave] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // ---------------------------------------------------------
    // BRAVE BROWSER DETECTION (HARD BLOCK)
    // ---------------------------------------------------------
    useEffect(() => {
        const checkBrave = async () => {
            const braveDetected = await isBraveBrowser();
            setIsBrave(braveDetected);
        };
        checkBrave();
    }, []);

    // ---------------------------------------------------------
    // ONLINE/OFFLINE LISTENER
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // EARLY ENTRY COUNTDOWN
    // ---------------------------------------------------------
    useEffect(() => {
        if (!examStartTime) {
            setIsExamReady(true);
            return;
        }

        const target = new Date(examStartTime).getTime();
        const tick = () => {
            const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
            setCountdown(remaining);
            if (remaining <= 0) {
                setIsExamReady(true);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [examStartTime]);

    // ---------------------------------------------------------
    // HARDWARE CHECKS
    // ---------------------------------------------------------
    const startHardwareCheck = useCallback(async () => {
        try {
            // Stop existing stream before re-requesting
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try { await videoRef.current.play(); } catch { /* autoplay may fail silently */ }
            }

            const hasVideo = stream.getVideoTracks().length > 0;
            const hasAudio = stream.getAudioTracks().length > 0;
            setChecks(prev => ({ ...prev, camera: hasVideo, mic: hasAudio }));
        } catch (err) {
            console.error('Hardware access error:', err);
            setChecks(prev => ({ ...prev, camera: false, mic: false }));
        }
    }, []);

    useEffect(() => {
        if (stepId === 'hardware') startHardwareCheck();
        // NOTE: We do NOT stop tracks on cleanup anymore — stream is handed off to BehavioralProctor
    }, [stepId, startHardwareCheck]);

    // ---------------------------------------------------------
    // CONNECTIVITY CHECK
    // ---------------------------------------------------------
    const checkConnectivity = useCallback(async () => {
        setLatency(null);
        try {
            const startTime = Date.now();
            await fetch('/robots.txt', { mode: 'no-cors', cache: 'no-store' });
            setLatency(Date.now() - startTime);
            setChecks(prev => ({ ...prev, internet: true }));
        } catch {
            setChecks(prev => ({ ...prev, internet: false }));
        }
    }, []);

    useEffect(() => {
        if (stepId === 'connectivity') checkConnectivity();
    }, [stepId, checkConnectivity]);

    // ---------------------------------------------------------
    // ID CAPTURE LOGIC
    // ---------------------------------------------------------
    const captureID = useCallback(() => {
        if (!videoRef.current || !capturingSide) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            setIdCards(prev => ({ ...prev, [capturingSide]: dataUrl }));
            setCapturingSide(null);
        }
    }, [capturingSide]);

    // ---------------------------------------------------------
    // COUNTDOWN FORMATTER
    // ---------------------------------------------------------
    const formatCountdown = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const steps: { id: string; title: string; icon: any }[] = [
        { id: 'hardware', title: 'Hardware Verification', icon: ShieldCheck },
        { id: 'connectivity', title: 'Connectivity Check', icon: Wifi }
    ];

    if (requireIdCapture) {
        steps.push({ id: 'id-capture', title: 'Identity Verification', icon: CreditCard });
    }
    // Always show instructions as the final step
    steps.push({ id: 'instructions', title: 'Exam Protocol & Instructions', icon: BookOpen });

    const currentStepIndex = steps.findIndex(s => s.id === stepId) ?? 0;
    const currentStep = steps[currentStepIndex];

    // Animation variants
    const panelVariants = {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
        exit: { opacity: 0, x: -40, transition: { duration: 0.3 } }
    };

    const canEnterExam = isExamReady && (!requireIdCapture || idCards.front);

    if (isBrave) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-3xl p-8 max-w-lg w-full text-center border border-red-500/30 shadow-2xl">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
            {/* Floating decorative elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-20 left-10 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-20 right-20 w-48 h-48 bg-orange-200/40 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/2 right-1/3 w-24 h-24 bg-yellow-200/30 rounded-full blur-2xl"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="bg-white/80 backdrop-blur-xl border border-amber-200/50 rounded-3xl p-8 max-w-4xl w-full shadow-[0_20px_60px_-10px_rgba(251,191,36,0.15)] overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 mb-1"
                        >
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <p className="text-amber-600 text-[10px] font-black uppercase tracking-[0.25em]">Virtual Exam Hall</p>
                        </motion.div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{examTitle}</h1>
                    </div>
                    <div className="flex gap-2">
                        {steps.map((s, idx) => (
                            <motion.div
                                key={s.id}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: idx * 0.15, duration: 0.4 }}
                                className={`h-2 w-14 rounded-full transition-all duration-500 origin-left ${currentStepIndex >= idx
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                                    : 'bg-amber-100'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Early Entry Countdown Banner */}
                <AnimatePresence>
                    {!isExamReady && countdown !== null && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-5 text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.02, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                </motion.div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Exam Starts In</p>
                                <p className="text-3xl font-black text-blue-700 tabular-nums">{formatCountdown(countdown)}</p>
                                <p className="text-xs text-blue-400 mt-2 font-medium">Complete your verification while you wait. You're ahead of the rush!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left Column: Camera & Interactive Area */}
                    <div className="space-y-5">
                        <motion.div
                            layout
                            className="relative aspect-video bg-slate-900 rounded-2xl border-2 border-amber-200 overflow-hidden shadow-lg group"
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />

                            {/* Camera/Mic Indicators */}
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                                <div className="flex gap-2">
                                    <motion.div
                                        animate={checks.camera ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className={`p-2 rounded-lg backdrop-blur-md ${checks.camera ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}
                                    >
                                        <Camera className="h-4 w-4" />
                                    </motion.div>
                                    <motion.div
                                        animate={checks.mic ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                        className={`p-2 rounded-lg backdrop-blur-md ${checks.mic ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}
                                    >
                                        <Mic className="h-4 w-4" />
                                    </motion.div>
                                </div>
                                {stepId === 'id-capture' && capturingSide && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-amber-500 px-3 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg"
                                    >
                                        Position {capturingSide} of ID
                                    </motion.div>
                                )}
                            </div>

                            {/* ID Capture overlay guide */}
                            <AnimatePresence>
                                {stepId === 'id-capture' && capturingSide && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 border-[3px] border-dashed border-amber-400/60 m-6 rounded-xl pointer-events-none flex items-center justify-center"
                                    >
                                        <div className="text-white/20 uppercase font-black text-3xl transform -rotate-6 select-none">Place ID Here</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* No camera placeholder */}
                            {!checks.camera && stepId === 'hardware' && (
                                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <Camera className="h-10 w-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                                        <p className="text-slate-500 text-xs font-bold">Requesting camera access…</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* ID Card Thumbnails */}
                        <AnimatePresence mode="wait">
                            {stepId === 'id-capture' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    {(['front', 'back'] as const).map((side) => (
                                        <div key={side} className="space-y-2">
                                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest text-center">
                                                {side === 'front' ? 'Front View' : 'Back View'}
                                            </p>
                                            <div className="aspect-[3/2] bg-amber-50 rounded-xl overflow-hidden border-2 border-amber-200/50 relative group hover:border-amber-400 transition-all">
                                                {idCards[side] ? (
                                                    <img src={idCards[side]} className="w-full h-full object-cover" alt={`ID ${side}`} />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-amber-300">
                                                        <CreditCard className="h-8 w-8 opacity-40" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setCapturingSide(side)}
                                                    className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/80 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                >
                                                    <Camera className="text-white h-6 w-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Capture Button */}
                        <AnimatePresence>
                            {capturingSide && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Button
                                        variant="primary"
                                        className="w-full py-4 uppercase font-black tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg"
                                        onClick={captureID}
                                    >
                                        <Camera className="h-4 w-4 mr-2" />
                                        Capture {capturingSide}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Status & Steps */}
                    <div className="flex flex-col justify-between">
                        <div className="space-y-5">
                            <motion.h2
                                key={stepId}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-slate-800 font-black uppercase text-xl tracking-tight flex items-center gap-3"
                            >
                                {(() => {
                                    if (!currentStep) return null;
                                    const StepIcon = currentStep.icon;
                                    return <StepIcon className="h-6 w-6 text-amber-500" />;
                                })()}
                                {currentStep?.title}
                            </motion.h2>

                            <AnimatePresence mode="wait">
                                {stepId === 'hardware' && (
                                    <motion.div key="step-hardware" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 shadow-sm">
                                            <ul className="space-y-4">
                                                {[
                                                    { label: 'Camera Access', ok: checks.camera, icon: Camera },
                                                    { label: 'Microphone Access', ok: checks.mic, icon: Mic },
                                                ].map((item) => (
                                                    <motion.li
                                                        key={item.label}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${item.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                <item.icon className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-slate-700 font-bold">{item.label}</span>
                                                        </div>
                                                        <motion.div
                                                            animate={item.ok ? { scale: [0.8, 1.2, 1] } : {}}
                                                            transition={{ duration: 0.4 }}
                                                        >
                                                            {item.ok ? <CheckCircle2 className="text-emerald-500 h-5 w-5" /> : <AlertCircle className="text-amber-400 h-5 w-5 animate-pulse" />}
                                                        </motion.div>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                            {(!checks.camera || !checks.mic) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-6 text-[10px] font-black uppercase border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    onClick={startHardwareCheck}
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-2" /> Re-check Hardware
                                                </Button>
                                            )}
                                            <p className="text-[10px] text-amber-600/60 mt-4 italic font-medium">
                                                Grant camera & microphone access in your browser to proceed.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {stepId === 'connectivity' && (
                                    <motion.div key="step-connectivity" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-amber-700/60 font-black uppercase text-[10px]">Connection Status</span>
                                                <motion.span
                                                    animate={isOnline && checks.internet ? { scale: [1, 1.05, 1] } : {}}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={isOnline && checks.internet ? 'text-emerald-600 font-black' : 'text-red-500 font-black'}
                                                >
                                                    {isOnline && checks.internet ? '● OPTIMAL' : isOnline ? '◌ TESTING…' : '✕ OFFLINE'}
                                                </motion.span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-amber-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: checks.internet ? '100%' : '20%' }}
                                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                                        className={`h-full rounded-full ${latency && latency < 200 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                                                    />
                                                </div>
                                                <span className="text-slate-700 font-mono text-sm font-bold">{latency ? `${latency}ms` : '--'}</span>
                                            </div>
                                            <p className="text-xs text-amber-600/60 leading-relaxed italic font-medium">
                                                Ensure you are on a stable high-speed network. Avoid public Wi-Fi or unstable hotspots.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-[10px] font-black uppercase border-amber-300 text-amber-700 hover:bg-amber-50"
                                                onClick={checkConnectivity}
                                            >
                                                <RefreshCw className="h-3 w-3 mr-2" /> Re-test Connection
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {stepId === 'id-capture' && (
                                    <motion.div key="step-id" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 shadow-sm">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                                    <CreditCard className="h-6 w-6" />
                                                </div>
                                                <p className="text-sm text-slate-900 font-bold">Show your institutional ID card or valid Govt ID to the camera clearly.</p>
                                            </div>
                                            <div className="bg-orange-50 border border-orange-200/50 rounded-xl p-4">
                                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">🔒 Privacy Notice</p>
                                                <p className="text-[11px] text-orange-800 leading-relaxed font-semibold">This capture is used for verification purposes only and is stored securely in your exam record.</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {stepId === 'instructions' && (
                                    <motion.div key="step-instructions" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 shadow-sm space-y-5">
                                            {/* Exam Metadata Grid */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white/80 rounded-xl p-3.5 text-center border border-amber-200/40 shadow-sm">
                                                    <FileText className="h-4 w-4 text-amber-500 mx-auto mb-1.5" />
                                                    <p className="text-xl font-black text-slate-800">{questionsCount ?? '—'}</p>
                                                    <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mt-0.5">Questions</p>
                                                </div>
                                                <div className="bg-white/80 rounded-xl p-3.5 text-center border border-amber-200/40 shadow-sm">
                                                    <Timer className="h-4 w-4 text-amber-500 mx-auto mb-1.5" />
                                                    <p className="text-xl font-black text-slate-800">{duration ?? '—'}</p>
                                                    <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mt-0.5">Minutes</p>
                                                </div>
                                                <div className="bg-white/80 rounded-xl p-3.5 text-center border border-amber-200/40 shadow-sm">
                                                    <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mb-1.5" />
                                                    <p className="text-xl font-black text-red-600">{violationThreshold}</p>
                                                    <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mt-0.5">Max Violations</p>
                                                </div>
                                            </div>

                                            {/* Instructions Body */}
                                            {description && description.trim() ? (
                                                <div className="bg-white/70 border border-amber-200/40 rounded-xl p-5">
                                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <BookOpen className="h-3 w-3" /> Exam Instructions
                                                    </p>
                                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                                        {description}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-white/70 border border-amber-200/40 rounded-xl p-5 text-center">
                                                    <BookOpen className="h-6 w-6 text-amber-300 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-500 font-medium">No specific instructions provided for this exam.</p>
                                                </div>
                                            )}

                                            {/* Security Notice */}
                                            <div className="bg-orange-50 border border-orange-200/50 rounded-xl p-4">
                                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">⚠ Security Protocol</p>
                                                <p className="text-[11px] text-orange-800 leading-relaxed font-semibold">
                                                    AI proctoring is active. Tab switching, face absence, gaze deviation, and voice activity will trigger violation alerts. Exceeding the maximum violation limit will result in automatic suspension.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="pt-8">
                            {currentStepIndex < steps.length - 1 ? (
                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                    <Button
                                        className="w-full py-4 uppercase font-black tracking-widest group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg"
                                        onClick={() => setStepId(steps[currentStepIndex + 1].id as any)}
                                        disabled={
                                            stepId === 'hardware' ? (!checks.camera || !checks.mic) :
                                                stepId === 'connectivity' ? !checks.internet :
                                                    stepId === 'id-capture' ? (!idCards.front || !idCards.back) :
                                                        false
                                        }
                                    >
                                        Proceed to {steps[currentStepIndex + 1].title.split(' ')[0]}
                                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                    {stepId === 'id-capture' && (!idCards.front || !idCards.back) && (
                                        <p className="text-[10px] text-amber-600 text-center mt-2 font-black uppercase tracking-widest animate-pulse">
                                            Capture both sides to proceed
                                        </p>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div whileHover={canEnterExam ? { scale: 1.01 } : {}} whileTap={canEnterExam ? { scale: 0.99 } : {}}>
                                    <Button
                                        className={`w-full py-5 uppercase font-black tracking-widest border-0 shadow-lg transition-all ${canEnterExam
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                        onClick={() => onComplete({ idCardFront: idCards.front, idCardBack: idCards.back, stream: streamRef.current })}
                                        disabled={!canEnterExam}
                                    >
                                        {!isExamReady
                                            ? `Exam starts in ${countdown !== null ? formatCountdown(countdown) : '…'}`
                                            : (requireIdCapture && !idCards.front)
                                                ? 'Capture Front ID to Continue'
                                                : 'Enter Active Exam'
                                        }
                                    </Button>
                                    {!isExamReady && (
                                        <motion.p
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="text-xs text-blue-500 text-center mt-3 font-bold"
                                        >
                                            ✓ You're checked in early — saving you time!
                                        </motion.p>
                                    )}
                                </motion.div>
                            )}
                            <p className="text-[9px] text-amber-600 text-center uppercase font-black tracking-widest mt-5">Secure Encrypted Session</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VirtualExamHall;
