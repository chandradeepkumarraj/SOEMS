/**
 * BehavioralProctor.tsx - Advanced AI Proctoring Component (Round 27)
 * 
 * Real-time unfair means detection using:
 *  1. face-api.js (TinyFaceDetector + optional FaceLandmarks68) for:
 *     - Multiple face detection → immediate violation + snapshot evidence
 *     - Multiple face detection → immediate violation + snapshot evidence
 *     - Face absence detection → 7 misses in 8s sliding window + snapshot evidence
 *     - Gaze tracking (optional, teacher-controlled) → 7 gaze-away in 8s window
 *  2. Web Audio API (AnalyserNode + RMS) for:
 *     - Voice/speech activity detection (~2.25s sustained speech)
 *  3. Web Speech API (SpeechRecognition) for:
 *     - Real-time voice-to-text transcription as evidence (English en-IN)
 * 
 * Evidence Capture:
 *  - Face violations: base64 JPEG webcam snapshot
 *  - Voice violations: transcribed text from speech recognition
 *  Both are passed to parent via onViolation callback.
 * 
 * Architecture: 100% client-side processing. Only violation events (text +
 * snapshot + transcript) are sent to backend. Zero video/audio streaming.
 * 
 * Performance Safeguards:
 *  - TinyFaceDetector (lightest model, ~190KB)
 *  - FaceLandmarks68 loaded ONLY when gaze tracking enabled (~350KB extra)
 *  - Detection interval: 3 seconds (balanced accuracy/perf)
 *  - Sliding-window thresholds prevent false positives
 *  - Audio RMS (cheapest analysis) instead of FFT
 *  - Models lazy-loaded only when exam starts
 */
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Video, VideoOff, Mic, MicOff, Eye, Shield } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
interface ViolationEvidence {
    /** Base64-encoded JPEG snapshot from webcam at the moment of violation */
    snapshot?: string;
    /** Voice-to-text transcription from Web Speech API */
    transcript?: string;
}

interface BehavioralProctorProps {
    /** Callback to trigger a violation alert in ExamInterface */
    onViolation: (type: string, message: string, evidence?: ViolationEvidence) => void | Promise<void>;
    /** Whether the exam is currently active (not paused/suspended) */
    isActive: boolean;
    /** Whether proctoring is enabled for this exam */
    enabled: boolean;
    /** Optional existing MediaStream from VirtualExamHall to avoid double getUserMedia */
    existingStream?: MediaStream | null;
    /** Whether face detection is enabled (multiple faces + no face) */
    enableFaceDetection?: boolean;
    /** Whether voice detection is enabled (speech + transcription) */
    enableVoiceDetection?: boolean;
    /** Whether gaze tracking is enabled for this exam (teacher-controlled) */
    enableGazeTracking?: boolean;
    /** Fine-grained AI performance settings from exam configuration */
    performanceSettings?: {
        gazeYawThreshold?: number;
        faceScoreThreshold?: number;
        audioRMSThreshold?: number;
        violationCooldownMs?: number;
    };
}

// Violation type constants for consistency across the system
const VIOLATION = {
    MULTIPLE_FACES: 'Multiple Faces',
    NO_FACE: 'No Face Detected',
    GAZE_AWAY: 'Gaze Away Detected',
    VOICE: 'Voice Detected',
    HARDWARE_ERROR: 'Camera/Mic Error',
} as const;

// ============================================================
// CONFIGURATION (Performance-tuned defaults)
// ============================================================
const CONFIG = {
    // Face detection interval in ms (1s to allow matching rapid thresholds)
    DETECTION_INTERVAL_MS: 1000,
    // Sliding window for no-face detection (moderate: 8 seconds)
    NO_FACE_WINDOW_MS: 8000,
    // Number of no-face detections within window to trigger alert (moderate: 7)
    NO_FACE_THRESHOLD: 7,
    // Sliding window for gaze-away detection (moderate: 8 seconds)
    GAZE_WINDOW_MS: 8000,
    // Number of gaze-away detections within window to trigger alert (moderate: 7)
    GAZE_THRESHOLD: 7,
    // Audio RMS threshold (moderate: 0.020 filters low background noise)
    AUDIO_RMS_THRESHOLD: 0.020,
    // Audio check interval in ms
    AUDIO_CHECK_INTERVAL_MS: 750,
    // Audio consecutive threshold (sustained speech: 750ms × 3 = ~2.25 seconds)
    AUDIO_CONSECUTIVE_THRESHOLD: 3,
    // Cooldown between same-type violations in ms (prevents violation storm)
    VIOLATION_COOLDOWN_MS: 15000,
    // Video element dimensions (small preview)
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 120,
    // TinyFaceDetector score threshold (moderate: 0.55 requires higher confidence)
    FACE_SCORE_THRESHOLD: 0.55,
    // TinyFaceDetector input size (smaller = faster, less accurate)
    FACE_INPUT_SIZE: 224,
    // Snapshot quality (0.0 - 1.0) for JPEG compression
    SNAPSHOT_QUALITY: 0.6,
    // Snapshot dimensions (small to keep payload manageable)
    SNAPSHOT_WIDTH: 320,
    SNAPSHOT_HEIGHT: 240,
    // Gaze tracking: yaw angle threshold in degrees (moderate: 35°)
    GAZE_YAW_THRESHOLD: 35,
} as const;

// ============================================================
// COMPONENT
// ============================================================
const BehavioralProctor = memo(function BehavioralProctor({
    onViolation,
    isActive,
    enabled,
    existingStream,
    enableFaceDetection = true,
    enableVoiceDetection = true,
    enableGazeTracking = false,
    performanceSettings
}: BehavioralProctorProps) {
    // Merge performance settings with defaults
    const config = {
        ...CONFIG,
        GAZE_YAW_THRESHOLD: performanceSettings?.gazeYawThreshold ?? CONFIG.GAZE_YAW_THRESHOLD,
        FACE_SCORE_THRESHOLD: performanceSettings?.faceScoreThreshold ?? CONFIG.FACE_SCORE_THRESHOLD,
        AUDIO_RMS_THRESHOLD: performanceSettings?.audioRMSThreshold ?? CONFIG.AUDIO_RMS_THRESHOLD,
        VIOLATION_COOLDOWN_MS: performanceSettings?.violationCooldownMs ?? CONFIG.VIOLATION_COOLDOWN_MS,
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const faceApiRef = useRef<any>(null);
    const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Sliding window timestamp arrays
    const noFaceTimestampsRef = useRef<number[]>([]);
    const gazeTimestampsRef = useRef<number[]>([]);

    // Voice detection counters
    const voiceCountRef = useRef(0);

    // Speech recognition state
    const speechRecRef = useRef<any>(null);
    const transcriptBufferRef = useRef<string>('');

    // Cooldown tracking
    const lastViolationTimeRef = useRef<Record<string, number>>({});

    // State
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [micReady, setMicReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('Initializing...');
    const [lastDetection, setLastDetection] = useState<string>('');

    // ----------------------------------------------------------------
    // Snapshot capture utility
    // ----------------------------------------------------------------
    const captureSnapshot = useCallback((): string | undefined => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return undefined;

        try {
            if (!snapshotCanvasRef.current) {
                snapshotCanvasRef.current = document.createElement('canvas');
            }
            const canvas = snapshotCanvasRef.current;
            canvas.width = CONFIG.SNAPSHOT_WIDTH;
            canvas.height = CONFIG.SNAPSHOT_HEIGHT;

            const ctx = canvas.getContext('2d');
            if (!ctx) return undefined;

            ctx.drawImage(video, 0, 0, CONFIG.SNAPSHOT_WIDTH, CONFIG.SNAPSHOT_HEIGHT);
            return canvas.toDataURL('image/jpeg', CONFIG.SNAPSHOT_QUALITY);
        } catch (err) {
            console.warn('[BehavioralProctor] Snapshot capture failed:', err);
            return undefined;
        }
    }, []);

    // ----------------------------------------------------------------
    // Sliding window helper: prune timestamps older than windowMs
    // ----------------------------------------------------------------
    const pruneWindow = useCallback((timestamps: number[], windowMs: number): number[] => {
        const cutoff = Date.now() - windowMs;
        return timestamps.filter(t => t > cutoff);
    }, []);

    // ----------------------------------------------------------------
    // Violation dispatcher with cooldown
    // ----------------------------------------------------------------
    const dispatchViolation = useCallback((type: string, message: string, includeSnapshot: boolean = false, transcript?: string) => {
        const now = Date.now();
        const lastTime = lastViolationTimeRef.current[type] || 0;

        if (now - lastTime < config.VIOLATION_COOLDOWN_MS) return; // Cooldown active

        lastViolationTimeRef.current[type] = now;

        const evidence: ViolationEvidence = {};
        if (includeSnapshot) {
            evidence.snapshot = captureSnapshot();
        }
        if (transcript) {
            evidence.transcript = transcript;
        }

        onViolation(type, message, Object.keys(evidence).length > 0 ? evidence : undefined);
    }, [onViolation, captureSnapshot, config.VIOLATION_COOLDOWN_MS]);

    // ----------------------------------------------------------------
    // 1. Load face-api.js models (lazy, on mount)
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!enabled || !enableFaceDetection) return;

        let cancelled = false;

        const loadModels = async () => {
            try {
                setStatusText('Loading AI models...');
                const faceapi = await import('@vladmandic/face-api');
                faceApiRef.current = faceapi;

                const MODEL_URL = '/models';

                // Always load TinyFaceDetector
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

                // Conditionally load FaceLandmarks68 if gaze tracking is enabled
                if (enableGazeTracking) {
                    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                    console.log('[BehavioralProctor] Loaded TinyFaceDetector + FaceLandmarks68 (gaze tracking ON)');
                } else {
                    console.log('[BehavioralProctor] Loaded TinyFaceDetector only (gaze tracking OFF)');
                }

                if (!cancelled) {
                    setModelsLoaded(true);
                    setStatusText('AI models ready');
                }
            } catch (err: any) {
                console.error('[BehavioralProctor] Model loading failed:', err);
                if (!cancelled) {
                    setError('Face detection models failed to load. Proctoring limited.');
                    setStatusText('Model load failed');
                }
            }
        };

        loadModels();
        return () => { cancelled = true; };
    }, [enabled, enableFaceDetection, enableGazeTracking]);

    // ----------------------------------------------------------------
    // 2. Initialize Camera + Microphone streams
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!enabled || (!enableFaceDetection && !enableVoiceDetection)) return;

        let cancelled = false;
        let ownsStream = false;

        const needsVideo = enableFaceDetection;
        const needsAudio = enableVoiceDetection;

        const initStreams = async () => {
            try {
                setStatusText('Requesting camera & mic...');
                let stream: MediaStream;

                if (existingStream && existingStream.active && existingStream.getTracks().length > 0) {
                    stream = existingStream;
                    console.log('[BehavioralProctor] Reusing existing stream');
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: needsVideo ? {
                            width: { ideal: 320, max: 640 },
                            height: { ideal: 240, max: 480 },
                            frameRate: { ideal: 15, max: 20 },
                            facingMode: 'user'
                        } : false,
                        audio: needsAudio ? {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        } : false
                    });
                    ownsStream = true;
                    console.log('[BehavioralProctor] Created new stream');
                }

                if (cancelled) {
                    if (ownsStream) stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;

                // Attach video (only if face detection enabled)
                if (needsVideo && videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                        setCameraReady(true);
                    } catch (err: any) {
                        if (err.name !== 'AbortError') throw err;
                    }
                }

                // Initialize Audio Analyser (only if voice detection enabled)
                if (needsAudio) {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const source = audioCtx.createMediaStreamSource(stream);
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 512;
                    analyser.smoothingTimeConstant = 0.3;
                    source.connect(analyser);
                    audioContextRef.current = audioCtx;
                    analyserRef.current = analyser;
                    setMicReady(true);
                }

                setStatusText('Monitoring active');
                console.log('[BehavioralProctor] Camera + Mic initialized');
            } catch (err: any) {
                console.error('[BehavioralProctor] Stream init failed:', err);
                if (!cancelled) {
                    const msg = err.name === 'NotAllowedError'
                        ? 'Camera/Mic permission denied. Proctoring requires access.'
                        : `Hardware error: ${err.message}`;
                    setError(msg);
                    setStatusText('Hardware error');
                    dispatchViolation(VIOLATION.HARDWARE_ERROR, msg);
                }
            }
        };

        initStreams();

        return () => {
            cancelled = true;
            if (ownsStream && streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            streamRef.current = null;
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close().catch(() => { });
            }
            audioContextRef.current = null;
            analyserRef.current = null;
            setCameraReady(false);
            setMicReady(false);
        };
    }, [enabled, enableFaceDetection, enableVoiceDetection, dispatchViolation, existingStream]);

    // ----------------------------------------------------------------
    // 3. Initialize Web Speech API for voice-to-text transcription
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!enabled || !enableVoiceDetection || !micReady || !isActive) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[BehavioralProctor] SpeechRecognition not supported in this browser. Transcription disabled.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // Indian English to capture mixed English/Hindi more sensitively
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            // Accumulate final results into transcript buffer
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const text = event.results[i][0].transcript.trim();
                    if (text) {
                        transcriptBufferRef.current = (transcriptBufferRef.current + ' ' + text).trim();
                        // Cap buffer length to avoid memory issues
                        if (transcriptBufferRef.current.length > 500) {
                            transcriptBufferRef.current = transcriptBufferRef.current.slice(-500);
                        }
                    }
                }
            }
        };

        recognition.onerror = (event: any) => {
            // 'no-speech' and 'aborted' are normal — don't log as errors
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.warn('[BehavioralProctor] SpeechRecognition error:', event.error);
            }
        };

        // Auto-restart on end (browser may stop it after silence)
        recognition.onend = () => {
            if (speechRecRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    // May fail if already started — safe to ignore
                }
            }
        };

        try {
            recognition.start();
            speechRecRef.current = recognition;
            console.log('[BehavioralProctor] SpeechRecognition started (en-IN)');
        } catch (e) {
            console.warn('[BehavioralProctor] Failed to start SpeechRecognition:', e);
        }

        return () => {
            speechRecRef.current = null;
            try {
                recognition.stop();
            } catch (e) { /* safe to ignore */ }
        };
    }, [enabled, micReady, isActive]);

    // ----------------------------------------------------------------
    // 4. Face Detection Loop (every 3s, RAF-gated)
    //    Detects: Multiple Faces + No Face (sliding window) + Gaze (optional)
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!enabled || !enableFaceDetection || !modelsLoaded || !cameraReady || !isActive) return;

        const faceapi = faceApiRef.current;
        if (!faceapi || !videoRef.current) return;

        let lastRunTime = 0;
        let animFrameId: number;
        let isRunning = true;

        const tinyOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: config.FACE_INPUT_SIZE,
            scoreThreshold: config.FACE_SCORE_THRESHOLD,
        });

        const runDetection = async (timestamp: number) => {
            if (!isRunning) return;

            // Throttle: only run every DETECTION_INTERVAL_MS
            if (timestamp - lastRunTime < CONFIG.DETECTION_INTERVAL_MS) {
                animFrameId = requestAnimationFrame(runDetection);
                return;
            }
            lastRunTime = timestamp;

            try {
                const video = videoRef.current;
                if (!video || video.readyState < 2) {
                    animFrameId = requestAnimationFrame(runDetection);
                    return;
                }

                const now = Date.now();

                if (enableGazeTracking) {
                    // Full detection with landmarks for gaze analysis
                    const detections = await faceapi
                        .detectAllFaces(video, tinyOptions)
                        .withFaceLandmarks();

                    const faceCount = detections.length;

                    // --- Scenario 1: MULTIPLE FACES ---
                    if (faceCount > 1) {
                        setLastDetection(`⚠ ${faceCount} faces detected`);
                        dispatchViolation(
                            VIOLATION.MULTIPLE_FACES,
                            `Unfair Means: ${faceCount} faces detected in frame. Only the exam taker should be visible.`,
                            true
                        );
                        noFaceTimestampsRef.current = [];
                    }
                    // --- Scenario 2: NO FACE ---
                    else if (faceCount === 0) {
                        noFaceTimestampsRef.current.push(now);
                        noFaceTimestampsRef.current = pruneWindow(noFaceTimestampsRef.current, CONFIG.NO_FACE_WINDOW_MS);

                        setLastDetection(`⚠ No face (${noFaceTimestampsRef.current.length}/${CONFIG.NO_FACE_THRESHOLD} in 9s)`);

                        if (noFaceTimestampsRef.current.length >= CONFIG.NO_FACE_THRESHOLD) {
                            dispatchViolation(
                                VIOLATION.NO_FACE,
                                `No Face Detected: Please come under the camera visibility immediately.`,
                                true
                            );
                            noFaceTimestampsRef.current = [];
                        }
                    }
                    // --- Scenario 3: SINGLE FACE → Check gaze ---
                    else if (faceCount === 1) {
                        noFaceTimestampsRef.current = [];
                        const landmarks = detections[0].landmarks;

                        // Simple gaze estimation using nose-to-jaw-center ratio
                        // If the nose tip is far from the center of the face box, student is looking away
                        const box = detections[0].detection.box;
                        const noseTip = landmarks.getNose()[3]; // Nose tip landmark
                        const faceCenterX = box.x + box.width / 2;
                        const deviation = Math.abs(noseTip.x - faceCenterX);
                        const deviationRatio = deviation / (box.width / 2);

                        // Threshold: if deviation > 50% of half-face-width, it's a gaze-away
                        if (deviationRatio > 0.5) {
                            gazeTimestampsRef.current.push(now);
                            gazeTimestampsRef.current = pruneWindow(gazeTimestampsRef.current, CONFIG.GAZE_WINDOW_MS);

                            setLastDetection(`⚠ Gaze away (${gazeTimestampsRef.current.length}/${CONFIG.GAZE_THRESHOLD} in 10s)`);

                            if (gazeTimestampsRef.current.length >= CONFIG.GAZE_THRESHOLD) {
                                dispatchViolation(
                                    VIOLATION.GAZE_AWAY,
                                    `Gaze Tracking Alert: You are looking away. Please look at the screen and focus on your exam.`,
                                    true
                                );
                                gazeTimestampsRef.current = [];
                            }
                        } else {
                            setLastDetection('✓ Face verified');
                        }
                    }
                } else {
                    // Simple face detection (no landmarks, no gaze tracking)
                    const detections = await faceapi.detectAllFaces(video, tinyOptions);
                    const faceCount = detections.length;

                    // --- Scenario 1: MULTIPLE FACES ---
                    if (faceCount > 1) {
                        setLastDetection(`⚠ ${faceCount} faces detected`);
                        dispatchViolation(
                            VIOLATION.MULTIPLE_FACES,
                            `Unfair Means: ${faceCount} faces detected in frame. Only the exam taker should be visible.`,
                            true
                        );
                        noFaceTimestampsRef.current = [];
                    }
                    // --- Scenario 2: NO FACE ---
                    else if (faceCount === 0) {
                        noFaceTimestampsRef.current.push(now);
                        noFaceTimestampsRef.current = pruneWindow(noFaceTimestampsRef.current, CONFIG.NO_FACE_WINDOW_MS);

                        setLastDetection(`⚠ No face (${noFaceTimestampsRef.current.length}/${CONFIG.NO_FACE_THRESHOLD} in 10s)`);

                        if (noFaceTimestampsRef.current.length >= CONFIG.NO_FACE_THRESHOLD) {
                            dispatchViolation(
                                VIOLATION.NO_FACE,
                                `No face detected in camera: ${noFaceTimestampsRef.current.length} misses within 10 seconds. Your face must remain visible.`,
                                true
                            );
                            noFaceTimestampsRef.current = [];
                        }
                    }
                    // --- Scenario 3: SINGLE FACE → All good ---
                    else if (faceCount === 1) {
                        noFaceTimestampsRef.current = [];
                        setLastDetection('✓ Face verified');
                    }
                }
            } catch (err) {
                console.warn('[BehavioralProctor] Detection error (non-fatal):', err);
            }

            if (isRunning) {
                animFrameId = requestAnimationFrame(runDetection);
            }
        };

        animFrameId = requestAnimationFrame(runDetection);

        return () => {
            isRunning = false;
            cancelAnimationFrame(animFrameId);
        };
    }, [enabled, modelsLoaded, cameraReady, isActive, enableGazeTracking, dispatchViolation, pruneWindow, config.FACE_INPUT_SIZE, config.FACE_SCORE_THRESHOLD]);

    // ----------------------------------------------------------------
    // 5. Audio Voice Detection Loop (every 750ms, ~3s sustained speech)
    //    Now includes transcript evidence from Web Speech API
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!enabled || !enableVoiceDetection || !micReady || !isActive) return;

        const analyser = analyserRef.current;
        if (!analyser) return;

        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudio = () => {
            analyser.getByteTimeDomainData(dataArray);

            // Calculate RMS (Root Mean Square) — measures audio energy
            let sumSquares = 0;
            for (let i = 0; i < bufferLength; i++) {
                const normalized = (dataArray[i] - 128) / 128;
                sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / bufferLength);

            if (rms > config.AUDIO_RMS_THRESHOLD) {
                voiceCountRef.current++;
                if (voiceCountRef.current >= config.AUDIO_CONSECUTIVE_THRESHOLD) {
                    // Grab accumulated transcript as evidence
                    const capturedTranscript = transcriptBufferRef.current.trim() || undefined;

                    dispatchViolation(
                        VIOLATION.VOICE,
                        'Background Noise Detected: Whispering or conversation heard. Please maintain silence.',
                        false, // no snapshot for voice
                        capturedTranscript
                    );

                    // Clear transcript buffer after submitting as evidence
                    transcriptBufferRef.current = '';
                    voiceCountRef.current = 0;
                }
            } else {
                // Gradual decay (don't reset to 0 instantly)
                voiceCountRef.current = Math.max(0, voiceCountRef.current - 1);
            }
        };

        const intervalId = setInterval(checkAudio, config.AUDIO_CHECK_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
        };
    }, [enabled, micReady, isActive, dispatchViolation, config.AUDIO_RMS_THRESHOLD, config.AUDIO_CONSECUTIVE_THRESHOLD, config.AUDIO_CHECK_INTERVAL_MS]);

    // ----------------------------------------------------------------
    // Don't render anything if not enabled
    // ----------------------------------------------------------------
    if (!enabled) return null;

    return (
        <div className="fixed bottom-4 right-4 z-40 select-none">
            {/* Webcam Preview Card */}
            <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden"
                style={{ width: CONFIG.PREVIEW_WIDTH + 16 }}>
                {/* Video Feed */}
                <div className="relative" style={{ width: CONFIG.PREVIEW_WIDTH + 16, height: CONFIG.PREVIEW_HEIGHT }}>
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-t-2xl"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Status Overlay */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${cameraReady && isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[8px] font-black text-white/80 uppercase tracking-widest drop-shadow-md">
                            {cameraReady ? 'AI PROCTORING' : 'CONNECTING'}
                        </span>
                    </div>

                    {/* Gaze tracking indicator */}
                    {enableGazeTracking && cameraReady && (
                        <div className="absolute top-1.5 right-1.5 bg-indigo-600/80 rounded-full px-1.5 py-0.5">
                            <span className="text-[6px] font-black text-white uppercase tracking-widest">GAZE</span>
                        </div>
                    )}

                    {/* Error overlay */}
                    {error && (
                        <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center p-2">
                            <p className="text-[9px] text-red-300 text-center font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    {/* No camera fallback */}
                    {!cameraReady && !error && (
                        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                            <VideoOff className="h-8 w-8 text-slate-600 animate-pulse" />
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="px-2.5 py-2 bg-slate-950/80 space-y-1">
                    {/* Detection Status */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3 text-blue-400" />
                            <span className="text-[8px] font-bold text-slate-400 truncate max-w-[100px]">
                                {lastDetection || statusText}
                            </span>
                        </div>
                        <Shield className="h-3 w-3 text-emerald-500" />
                    </div>

                    {/* Hardware Indicators */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            {cameraReady ? (
                                <Video className="h-2.5 w-2.5 text-green-400" />
                            ) : (
                                <VideoOff className="h-2.5 w-2.5 text-red-400" />
                            )}
                            <span className="text-[7px] font-bold text-slate-500 uppercase">
                                {cameraReady ? 'CAM' : 'OFF'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {micReady ? (
                                <Mic className="h-2.5 w-2.5 text-green-400" />
                            ) : (
                                <MicOff className="h-2.5 w-2.5 text-red-400" />
                            )}
                            <span className="text-[7px] font-bold text-slate-500 uppercase">
                                {micReady ? 'MIC' : 'OFF'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default BehavioralProctor;
