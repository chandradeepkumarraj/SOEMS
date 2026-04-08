import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, CheckCircle2, FileText, ShieldAlert, Cpu, Zap, Timer, Image, X, Users, UserCheck, Loader2 } from 'lucide-react';
import { getApiUrl } from '../config/apiConfig';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { createQuestion, updateQuestion } from '../services/questionService';
import { createExam, getExamById, updateExam } from '../services/examService';
import { getGroups, getSubgroups, getSystemDefaults } from '../services/adminService';
import { getProctors, getUserProfile } from '../services/userService';
import AIGeneratorModal from '../components/exam/AIGeneratorModal';
import { useAIStatus } from '../hooks/useAIStatus';
import { PerformanceSlider } from '../components/proctoring/ProctoringControls';
import { ProctoringConfig } from '../components/exam/ProctoringConfig';
import apiClient from '../services/apiClient';

interface Question {
    _id?: string;
    id: number;
    type: 'mcq' | 'descriptive';
    text: string;
    options: string[];
    optionImages: string[];   // parallel array; '' = text-only option
    imageUrl: string;          // '' = no question image
    correctOption: number;
    referenceAnswer?: string;
    points: number;
    difficulty: string;
}

export default function CreateExam() {
    const API_BASE = getApiUrl();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const cloneId = searchParams.get('clone');

    const [step, setStep] = useState(1);
    const [examData, setExamData] = useState({
        title: '',
        subject: '',
        duration: '',
        date: '',
        time: '',
        instructions: '',
        allowedGroups: [] as string[],
        allowedSubgroups: [] as string[],
        proctors: [] as string[],
        resultsPublished: false,
        autoComplete: true,
        gracePeriod: 0,
        proctoringConfig: {
            enableTabLock: true,
            enableFullscreen: true,
            enableInputLock: true,
            enableFaceDetection: true,
            enableVoiceDetection: true,
            enableGazeTracking: false,
            violationThreshold: 5,
            performanceSettings: {
                gazeYawThreshold: 40,
                faceScoreThreshold: 0.45,
                audioRMSThreshold: 0.010,
                violationCooldownMs: 15000
            }
        }
    });

    const [allProctors, setAllProctors] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [systemDefaults, setSystemDefaults] = useState<any>(null);
    const [isFetchingProctors, setIsFetchingProctors] = useState(false);

    const [saveAsNew, setSaveAsNew] = useState(false);
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [isAdaptive, setIsAdaptive] = useState(false);
    const [adaptiveConfig, setAdaptiveConfig] = useState({
        questionPoolSize: 10,
        questionsPerStudent: 15,
        subject: '',
        topic: ''
    });

    const { getModelDisplayName } = useAIStatus();
    const [groups, setGroups] = useState<any[]>([]);
    const [subgroups, setSubgroups] = useState<any[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsFetchingProctors(true);
            try {
                const [groupsData, proctorsData, profileData, defaultsData] = await Promise.all([
                    getGroups(),
                    getProctors(),
                    getUserProfile(),
                    getSystemDefaults()
                ]);
                setGroups(groupsData);
                setAllProctors(proctorsData);
                setUserProfile(profileData);
                setSystemDefaults(defaultsData);

                // Apply global defaults if this is a new exam (not edit or clone)
                if (!editId && !cloneId && defaultsData?.proctoringDefaults) {
                    setExamData(prev => ({
                        ...prev,
                        autoComplete: defaultsData.examDefaults?.autoComplete ?? prev.autoComplete,
                        duration: defaultsData.examDefaults?.defaultDuration?.toString() ?? prev.duration,
                        proctoringConfig: {
                            ...prev.proctoringConfig,
                            ...defaultsData.proctoringDefaults
                        }
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            } finally {
                setIsFetchingProctors(false);
            }
        };
        fetchInitialData();
    }, [editId, cloneId]);

    const fetchSubgroupsForGroup = async (groupId: string) => {
        try {
            const data = await getSubgroups(groupId);
            setSubgroups(data);
        } catch (error) {
            console.error('Failed to fetch subgroups:', error);
        }
    };

    const [questions, setQuestions] = useState<Question[]>([
        { id: 1, type: 'mcq', text: '', options: ['', '', '', ''], optionImages: ['', '', '', ''], imageUrl: '', correctOption: 0, points: 1, difficulty: 'medium' }
    ]);

    useEffect(() => {
        const fetchExam = async () => {
            const targetId = editId || cloneId;
            if (!targetId) return;

            try {
                const exam = await getExamById(targetId);
                const start = new Date(exam.startTime);

                setExamData({
                    title: cloneId
                        ? (exam.title.includes('(v') ? exam.title.replace(/\(v\d+\)$/, `(v${parseInt(exam.title.match(/\(v(\d+)\)$/)?.[1] || '1') + 1})`) : `${exam.title} (v2)`)
                        : exam.title,
                    description: exam.description || '',
                    instructions: exam.description || '',
                    subject: exam.questions?.[0]?.subject || '',
                    duration: exam.duration.toString(),
                    date: start.toISOString().split('T')[0],
                    time: start.toTimeString().slice(0, 5),
                    allowedGroups: exam.allowedGroups || [],
                    allowedSubgroups: exam.allowedSubgroups || [],
                    proctors: exam.proctors || [],
                    resultsPublished: exam.resultsPublished || false,
                    autoComplete: exam.autoComplete !== undefined ? exam.autoComplete : true,
                    gracePeriod: exam.gracePeriod || 0,
                    proctoringConfig: exam.proctoringConfig || {
                        enableTabLock: true,
                        enableFullscreen: true,
                        enableInputLock: true,
                        enableFaceDetection: true,
                        enableVoiceDetection: true,
                        enableGazeTracking: false,
                        violationThreshold: 5,
                        performanceSettings: {
                            gazeYawThreshold: 40,
                            faceScoreThreshold: 0.45,
                            audioRMSThreshold: 0.010,
                            violationCooldownMs: 15000
                        }
                    }
                } as any);

                if (exam.allowedGroups && exam.allowedGroups.length === 1) {
                    fetchSubgroupsForGroup(exam.allowedGroups[0]);
                }

                if (exam.questions) {
                    setQuestions(exam.questions.map((q: any, i: number) => ({
                        _id: q._id,
                        id: i + 1,
                        type: q.type || 'mcq',
                        text: q.text,
                        options: q.options || ['', '', '', ''],
                        optionImages: q.optionImages || ['', '', '', ''],
                        imageUrl: q.imageUrl || '',
                        correctOption: q.correctAnswer,
                        referenceAnswer: q.referenceAnswer || '',
                        points: 1,
                        difficulty: q.difficulty || 'medium'
                    })));
                }
            } catch (error) {
                console.error('Failed to load exam:', error);
            }
        };
        fetchExam();
    }, [editId, cloneId]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            { id: questions.length + 1, type: 'mcq', text: '', options: ['', '', '', ''], optionImages: ['', '', '', ''], imageUrl: '', correctOption: 0, points: 1, difficulty: 'medium' }
        ]);
    };

    const handleAIGenerated = (aiQuestions: any[]) => {
        const startId = questions.length + 1;
        const mapped = aiQuestions.map((q: any, i: number) => ({
            id: startId + i,
            type: q.options ? 'mcq' as const : 'descriptive' as const,
            text: q.text || '',
            options: q.options || ['', '', '', ''],
            optionImages: ['', '', '', ''],
            imageUrl: '',
            correctOption: q.correctAnswer || 0,
            referenceAnswer: q.referenceAnswer || '',
            points: 1,
            difficulty: q.difficulty || 'medium'
        }));
        setQuestions([...questions, ...mapped]);
    };

    const handleQuestionChange = (id: number, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const handleOptionChange = (qId: number, optIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const newOptions = [...q.options];
                newOptions[optIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const handleQuestionImageUpload = async (qId: number, file: File) => {
        const formData = new FormData();
        formData.append('questionImage', file);
        try {
            const res = await apiClient.post('/api/upload/question-image', formData);
            if (res.data?.url) handleQuestionChange(qId, 'imageUrl', res.data.url);
        } catch (e) { alert('Image upload failed.'); }
    };

    const handleOptionImageUpload = async (qId: number, optIndex: number, file: File) => {
        const formData = new FormData();
        formData.append('optionImage', file);
        try {
            const res = await apiClient.post('/api/upload/option-image', formData);
            if (res.data?.url) {
                setQuestions(questions.map(q => {
                    if (q.id === qId) {
                        const imgs = [...(q.optionImages || ['', '', '', ''])];
                        imgs[optIndex] = res.data.url;
                        return { ...q, optionImages: imgs };
                    }
                    return q;
                }));
            }
        } catch (e) { alert('Option image upload failed.'); }
    };

    const handleDeleteQuestion = (id: number) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        // Validation
        if (!examData.title || !examData.subject || !examData.duration || !examData.date || !examData.time) {
            alert('Please fill in all exam details.');
            return;
        }
        if (!isAdaptive && questions.length === 0) {
            alert('Please add at least one question.');
            return;
        }
        if (examData.proctoringConfig.violationThreshold < 1) {
            alert('Security Threshold must be at least 1.');
            return;
        }

        setLoading(true);
        try {
            // 1. Process all questions (Skip for adaptive exams as pool is generated in background)
            const questionIds = [];
            if (!isAdaptive) {
                const isCloningOrNew = !editId || cloneId || saveAsNew;

                for (const q of questions) {
                    const questionData = {
                        type: q.type,
                        text: q.text,
                        options: q.options,
                        correctAnswer: q.correctOption,
                        referenceAnswer: q.referenceAnswer,
                        subject: examData.subject,
                        difficulty: q.difficulty || 'medium',
                        imageUrl: q.imageUrl || null,
                        optionImages: q.optionImages || []
                    };

                    if (!isCloningOrNew && q._id) {
                        // Update existing question
                        const updatedQuestion = await updateQuestion(q._id, questionData);
                        questionIds.push(updatedQuestion._id);
                    } else {
                        // Create new question (for new exams, clones, or newly added questions in an edit)
                        const savedQuestion = await createQuestion(questionData);
                        questionIds.push(savedQuestion._id);
                    }
                }
            }

            // 2. Create Exam
            const startDateTime = new Date(`${examData.date}T${examData.time}`);
            const durationMinutes = parseInt(examData.duration);
            const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

            const finalExamData = {
                title: examData.title,
                description: examData.instructions,
                questions: isAdaptive ? [] : questionIds,
                duration: durationMinutes,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                status: 'published',
                resultsPublished: examData.resultsPublished,
                autoComplete: examData.autoComplete,
                gracePeriod: examData.gracePeriod,
                allowedGroups: examData.allowedGroups,
                allowedSubgroups: examData.allowedSubgroups,
                proctors: examData.proctors,
                proctoringConfig: examData.proctoringConfig,
                isAdaptive,
                adaptiveConfig: isAdaptive ? {
                    ...adaptiveConfig,
                    subject: adaptiveConfig.subject || examData.subject
                } : undefined
            };

            if (editId && !cloneId && !saveAsNew) {
                await updateExam(editId, finalExamData);
            } else {
                await createExam(finalExamData);
            }

            const successSound = new Audio('/assets/sounds/notify_sound.mp3');
            successSound.volume = 0.6;
            successSound.play().catch(() => { });
            navigate('/teacher/exams'); // Navigate to My Exams list instead of dashboard for better flow

            // Adaptive Mode: notify teacher about background generation
            if (isAdaptive) {
                setTimeout(() => {
                    alert('🧠 AI is generating the adaptive question pool across Easy/Medium/Hard tiers. This may take ~30-60 seconds. Students will be able to start once generation completes.');
                }, 500);
            }
        } catch (error) {
            console.error('Failed to publish exam:', error);
            alert('Failed to publish exam. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
                {/* Header */}
                <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Link to="/teacher/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2 pl-0 hover:bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                                <ArrowLeft className="h-5 w-5" /> Exit
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-800" />
                        <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Secure Exam Designer</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mr-4">
                            <span className={step >= 1 ? 'text-primary' : 'opacity-40'}>01. Matrix Details</span>
                            <span className="text-slate-300 dark:text-slate-800">|</span>
                            <span className={step >= 2 ? 'text-primary' : 'opacity-40'}>02. Data Entry</span>
                            <span className="text-slate-300 dark:text-slate-800">|</span>
                            <span className={step >= 3 ? 'text-primary' : 'opacity-40'}>03. Verification</span>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700">
                            <Save className="h-4 w-4" /> Save Draft
                        </Button>
                    </div>
                </header>

                <main className="flex-1 max-w-4xl mx-auto w-full p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-8"
                            >
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                                    <FileText className="h-6 w-6 text-primary" /> Session Configuration
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Exam Title"
                                            placeholder="e.g. Advanced Calculus Final 2025"
                                            value={examData.title}
                                            onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        label="Subject / Course"
                                        placeholder="e.g. Mathematics 101"
                                        value={examData.subject}
                                        onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                                    />
                                    <Input
                                        label="Duration (minutes)"
                                        type="number"
                                        placeholder="e.g. 120"
                                        value={examData.duration}
                                        onChange={(e) => setExamData({ ...examData, duration: e.target.value })}
                                    />
                                    <Input
                                        label="Date"
                                        type="date"
                                        value={examData.date}
                                        onChange={(e) => setExamData({ ...examData, date: e.target.value })}
                                    />
                                    <Input
                                        label="Start Time"
                                        type="time"
                                        value={examData.time}
                                        onChange={(e) => setExamData({ ...examData, time: e.target.value })}
                                    />
                                    {examData.duration && examData.date && examData.time && (
                                        <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Timer className="h-5 w-5 text-slate-800 dark:text-slate-300" />
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.1em]">Exam Completion Engine Strategy</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div
                                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all group ${examData.autoComplete ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/50'}`}
                                                    onClick={() => setExamData({ ...examData, autoComplete: true })}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${examData.autoComplete ? 'border-primary' : 'border-gray-300 group-hover:border-primary/50'}`}>
                                                            {examData.autoComplete && <div className="h-2.5 w-2.5 bg-primary rounded-full"></div>}
                                                        </div>
                                                        <span className={`text-sm font-bold ${examData.autoComplete ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>Automatic (System Enforced)</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed pl-8 mb-3">
                                                        Exam will close automatically at strict cutoff. All active sessions are force-submitted.
                                                    </p>

                                                    {examData.autoComplete && (
                                                        <div className="pl-8 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grace Period (+mins)</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="120"
                                                                    value={examData.gracePeriod}
                                                                    onChange={(e) => setExamData({ ...examData, gracePeriod: parseInt(e.target.value) || 0 })}
                                                                    className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-sm text-center font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                                                />
                                                            </div>
                                                            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-2 flex-1">
                                                                <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest block mb-0.5">Absolute Cutoff</span>
                                                                <span className="text-xs font-black text-primary">
                                                                    {new Date(new Date(`${examData.date}T${examData.time}`).getTime() + (parseInt(examData.duration) + (examData.gracePeriod || 0)) * 60000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all group ${!examData.autoComplete ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm' : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/50'}`}
                                                    onClick={() => setExamData({ ...examData, autoComplete: false })}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${!examData.autoComplete ? 'border-amber-500' : 'border-gray-300 group-hover:border-amber-500/50'}`}>
                                                            {!examData.autoComplete && <div className="h-2.5 w-2.5 bg-amber-500 rounded-full"></div>}
                                                        </div>
                                                        <span className={`text-sm font-bold ${!examData.autoComplete ? 'text-amber-600 dark:text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>Manual Control (Instructor Led)</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed pl-8">
                                                        Exam stays open indefinitely until you click "Stop Exam". Candidate timers still enforce limits, but allows stragglers or late-joiners.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Candidate Matrix Eligibility</label>
                                            <div className="flex flex-wrap gap-2">
                                                {(userProfile?.role === 'admin' 
                                                    ? groups 
                                                    : groups.filter(g => 
                                                        userProfile?.managedGroups?.some((mg: any) => (mg._id || mg) === g._id) || 
                                                        userProfile?.groupId === g._id
                                                      )
                                                ).map(g => (
                                                    <button
                                                        key={g._id}
                                                        type="button"
                                                        onClick={() => {
                                                            const isSelected = examData.allowedGroups.includes(g._id);
                                                            const newGroups = isSelected
                                                                ? examData.allowedGroups.filter(id => id !== g._id)
                                                                : [...examData.allowedGroups, g._id];
                                                            
                                                            let updatedProctors = [...examData.proctors];
                                                            if (!isSelected) {
                                                                const mapping = userProfile?.departmentProctors?.find((m: any) => (m.groupId?._id || m.groupId) === g._id);
                                                                const mappedProctorId = mapping?.proctorId?._id || mapping?.proctorId;
                                                                if (mappedProctorId && !updatedProctors.includes(mappedProctorId)) {
                                                                    updatedProctors.push(mappedProctorId);
                                                                }
                                                            }

                                                            setExamData({ 
                                                                ...examData, 
                                                                allowedGroups: newGroups, 
                                                                allowedSubgroups: [],
                                                                proctors: updatedProctors
                                                            });

                                                            if (!isSelected && newGroups.length === 1) {
                                                                fetchSubgroupsForGroup(g._id);
                                                            }
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${examData.allowedGroups.includes(g._id)
                                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:border-primary'
                                                            }`}
                                                    >
                                                        {g.name}
                                                    </button>
                                                ))}
                                                {groups.length === 0 && <span className="text-xs text-slate-900 dark:text-slate-500 font-bold italic">No groups detected. Proceeding as global session.</span>}
                                            </div>
                                        </div>

                                        {examData.allowedGroups.length === 1 && subgroups.length > 0 && (
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-gray-700">Specific Session (Optional)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {subgroups.map(s => (
                                                        <button
                                                            key={s._id}
                                                            type="button"
                                                            onClick={() => {
                                                                const isSelected = examData.allowedSubgroups.includes(s._id);
                                                                const newSubs = isSelected
                                                                    ? examData.allowedSubgroups.filter(id => id !== s._id)
                                                                    : [...examData.allowedSubgroups, s._id];
                                                                setExamData({ ...examData, allowedSubgroups: newSubs });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${examData.allowedSubgroups.includes(s._id)
                                                                ? 'bg-indigo-500 text-white border-indigo-500'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-500'
                                                                }`}
                                                        >
                                                            {s.name} ({s.academicYear})
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-3">Academic Instructions</label>
                                        <textarea
                                            className="flex w-full rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all min-h-[120px]"
                                            placeholder="Define the rules of engagement for this assessment cycle..."
                                            value={examData.instructions}
                                            onChange={(e) => setExamData({ ...examData, instructions: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={examData.resultsPublished}
                                                onChange={(e) => setExamData({ ...examData, resultsPublished: e.target.checked })}
                                                className="h-4 w-4 text-primary rounded border-gray-300 dark:border-slate-800 focus:ring-primary bg-white dark:bg-slate-950"
                                            />
                                            <span className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Auto-Release Intelligence Repository</span>
                                        </label>
                                        <p className="text-xs text-slate-900 dark:text-slate-400 font-bold italic ml-6">Biometric results and analytics will be automatically exposed to candidates upon session closure.</p>
                                    </div>

                                    <ProctoringConfig
                                        config={examData.proctoringConfig}
                                        userProfile={userProfile}
                                        systemDefaults={systemDefaults}
                                        onChange={(field: string, value: any) => {
                                            if (field === 'all') {
                                                setExamData({
                                                    ...examData,
                                                    proctoringConfig: { ...examData.proctoringConfig, ...value }
                                                });
                                            } else {
                                                setExamData({
                                                    ...examData,
                                                    proctoringConfig: { ...examData.proctoringConfig, [field]: value }
                                                });
                                            }
                                        }}
                                    />

                                            {/* Nested Performance Sliders for Exam Overrides */}
                                            <div className="md:col-span-3 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Fine-Tune AI Sensitivity</h4>
                                                        <p className="text-[9px] text-slate-500 font-bold italic mt-1">Adjust how strictly the AI monitors the student for this exam.</p>
                                                    </div>
                                                    <div className="bg-primary/10 px-2 py-1 rounded text-[8px] font-black text-primary uppercase tracking-widest">Advanced Protocols Active</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                    <PerformanceSlider
                                                        label="Head-Turn Limit"
                                                        description="Sensitivity for detecting when a student looks away."
                                                        value={examData.proctoringConfig.performanceSettings?.gazeYawThreshold || 40}
                                                        min={10} max={90} step={5}
                                                        unit="°"
                                                        variant="compact"
                                                        disabled={!examData.proctoringConfig.enableGazeTracking}
                                                        onChange={(val) => setExamData({
                                                            ...examData,
                                                            proctoringConfig: {
                                                                ...examData.proctoringConfig,
                                                                performanceSettings: { ...examData.proctoringConfig.performanceSettings, gazeYawThreshold: val }
                                                            }
                                                        })}
                                                    />
                                                    <PerformanceSlider
                                                        label="Presence Sensitivity"
                                                        description="How strictly AI confirms student presence."
                                                        value={examData.proctoringConfig.performanceSettings?.faceScoreThreshold || 0.45}
                                                        min={0.1} max={0.9} step={0.05}
                                                        variant="compact"
                                                        disabled={!examData.proctoringConfig.enableFaceDetection}
                                                        onChange={(val) => setExamData({
                                                            ...examData,
                                                            proctoringConfig: {
                                                                ...examData.proctoringConfig,
                                                                performanceSettings: { ...examData.proctoringConfig.performanceSettings, faceScoreThreshold: val }
                                                            }
                                                        })}
                                                    />
                                                    <PerformanceSlider
                                                        label="Speaking Detection"
                                                        description="Adjust to ignore background noise."
                                                        value={examData.proctoringConfig.performanceSettings?.audioRMSThreshold || 0.010}
                                                        min={0.001} max={0.05} step={0.001}
                                                        variant="compact"
                                                        disabled={!examData.proctoringConfig.enableVoiceDetection}
                                                        onChange={(val) => setExamData({
                                                            ...examData,
                                                            proctoringConfig: {
                                                                ...examData.proctoringConfig,
                                                                performanceSettings: { ...examData.proctoringConfig.performanceSettings, audioRMSThreshold: val }
                                                            }
                                                        })}
                                                    />
                                                    <PerformanceSlider
                                                        label="Alert Wait Time"
                                                        description="Buffer between consecutive warnings."
                                                        value={examData.proctoringConfig.performanceSettings?.violationCooldownMs || 15000}
                                                        min={5000} max={60000} step={5000}
                                                        unit="ms"
                                                        variant="compact"
                                                        onChange={(val) => setExamData({
                                                            ...examData,
                                                            proctoringConfig: {
                                                                ...examData.proctoringConfig,
                                                                performanceSettings: { ...examData.proctoringConfig.performanceSettings, violationCooldownMs: val }
                                                            }
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Advanced Proctor Assignment Section */}
                                            <div className="mt-8 bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 border-2 border-indigo-500/30 shadow-2xl overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Users className="h-24 w-24 text-primary" />
                                                </div>
                                                
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                                                                <UserCheck className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Assignment Core</h3>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Managing Proctoring Human-in-the-loop</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        {/* Auto-Assignment Logic Context */}
                                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                                                                <Zap className="h-3 w-3" /> Auto-Assignment Engine
                                                            </h4>
                                                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                                System will automatically assign your <span className="text-white font-bold italic">Persistent Preferred Proctor</span> and available <span className="text-white font-bold italic">Departmental Staff</span> if no manual overrides are selected.
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Manual Overrides (Optional)</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {allProctors.map(proctor => (
                                                                    <button
                                                                        key={proctor._id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const isSelected = examData.proctors.includes(proctor._id);
                                                                            const newProctors = isSelected
                                                                                ? examData.proctors.filter(id => id !== proctor._id)
                                                                                : [...examData.proctors, proctor._id];
                                                                            setExamData({ ...examData, proctors: newProctors });
                                                                        }}
                                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${examData.proctors.includes(proctor._id)
                                                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-primary/50'
                                                                            }`}
                                                                    >
                                                                        {proctor.name}
                                                                        {examData.proctors.includes(proctor._id) && <CheckCircle2 className="h-3 w-3" />}
                                                                    </button>
                                                                ))}
                                                                {isFetchingProctors && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
                                                                        <Loader2 className="h-3 w-3 animate-spin" /> Synchronizing Staff...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {examData.proctors.length === 0 && userProfile?.defaultProctorId && (
                                                            <div className="flex items-center gap-3 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                                    Auto-Target: {allProctors.find(p => p._id === userProfile.defaultProctorId)?.name || 'Default Proctor'} (Persistent)
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                </div>

                                {/* Adaptive Mode Toggle */}
                                <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-8 mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-amber-500" />
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.15em]">Adaptive Mode (C.A.T.)</h3>
                                                <p className="text-[10px] text-slate-500 font-bold">AI dynamically adjusts question difficulty based on student performance</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isAdaptive}
                                                onChange={(e) => setIsAdaptive(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                        </label>
                                    </div>

                                    {isAdaptive && (
                                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-6 space-y-4 mt-4">
                                            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">AI will pre-generate a question pool across Easy/Medium/Hard tiers using {getModelDisplayName()}. Each student gets a unique, personalized question path.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Topic / Focus Area"
                                                    placeholder="e.g. React Hooks, Organic Chemistry"
                                                    value={adaptiveConfig.topic}
                                                    onChange={(e) => setAdaptiveConfig({ ...adaptiveConfig, topic: e.target.value })}
                                                />
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Pool Size (per tier)</label>
                                                    <input type="range" min={5} max={20} value={adaptiveConfig.questionPoolSize} onChange={(e) => setAdaptiveConfig({ ...adaptiveConfig, questionPoolSize: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                                                    <span className="text-sm font-bold text-amber-600">{adaptiveConfig.questionPoolSize} questions × 3 tiers = {adaptiveConfig.questionPoolSize * 3} total pool</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Questions per Student</label>
                                                    <input type="range" min={5} max={30} value={adaptiveConfig.questionsPerStudent} onChange={(e) => setAdaptiveConfig({ ...adaptiveConfig, questionsPerStudent: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                                                    <span className="text-sm font-bold text-amber-600">{adaptiveConfig.questionsPerStudent} questions</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <Button onClick={() => setStep(isAdaptive ? 3 : 2)} className="gap-2">
                                        {isAdaptive ? 'Next: Review & Publish' : 'Next: Add Questions'} <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Questions Builder</h2>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => setShowAIGenerator(true)} variant="outline" className="gap-2 border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20">
                                            <Cpu className="h-4 w-4" /> Generate with AI
                                        </Button>
                                        <Button onClick={handleAddQuestion} variant="outline" className="gap-2 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-800">
                                            <Plus className="h-4 w-4" /> Add Question
                                        </Button>
                                    </div>
                                </div>

                                {questions.map((q, qIndex) => (
                                    <div key={q.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 relative group">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                <button
                                                    onClick={() => handleQuestionChange(q.id, 'type', 'mcq')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${q.type === 'mcq' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    MCQ
                                                </button>
                                                <button
                                                    onClick={() => handleQuestionChange(q.id, 'type', 'descriptive')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${q.type === 'descriptive' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    AI Descriptive
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                className="p-2 text-gray-400 dark:text-slate-500 hover:text-error hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="mb-4 pr-32">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                                Question {qIndex + 1} ({q.type === 'mcq' ? 'Standard Assessment' : 'AI-Powered Theory'})
                                            </label>
                                            <textarea
                                                className="w-full rounded-lg border border-gray-300 dark:border-slate-800 p-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                                                placeholder="Type your question here..."
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                            />

                                            {/* Question Image Upload */}
                                            <div className="mt-2">
                                                {/* Always render label so clicking image also replaces it */}
                                                <label className="block cursor-pointer group">
                                                    {q.imageUrl ? (
                                                        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group-hover:ring-2 group-hover:ring-primary/40 transition-all">
                                                            <img
                                                                src={`${API_BASE}${q.imageUrl}`}
                                                                alt="Question visual"
                                                                className="w-full max-h-[30vh] object-contain block"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-black uppercase tracking-widest bg-black/60 px-3 py-1 rounded-lg transition-opacity">
                                                                    Click to Change Image
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); handleQuestionChange(q.id, 'imageUrl', ''); }}
                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow z-10"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 group-hover:border-primary/50 transition-colors">
                                                            <Image className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                                                            <span className="text-[10px] font-black text-slate-400 group-hover:text-primary uppercase tracking-widest transition-colors">Attach Question Image (optional)</span>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) handleQuestionImageUpload(q.id, e.target.files[0]);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        {q.type === 'mcq' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={optIndex} className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${q.id}`}
                                                                checked={q.correctOption === optIndex}
                                                                onChange={() => handleQuestionChange(q.id, 'correctOption', optIndex)}
                                                                className="h-4 w-4 text-primary focus:ring-primary flex-shrink-0"
                                                            />
                                                            <Input
                                                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                                value={opt}
                                                                onChange={(e) => handleOptionChange(q.id, optIndex, e.target.value)}
                                                                className="mb-0 font-bold flex-1"
                                                            />
                                                        </div>
                                                        {/* Option image */}
                                                        <label className="block cursor-pointer group/opt">
                                                            {q.optionImages?.[optIndex] ? (
                                                                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group-hover/opt:ring-2 group-hover/opt:ring-primary/40 transition-all">
                                                                    <img
                                                                        src={`${API_BASE}${q.optionImages[optIndex]}`}
                                                                        alt={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                                        className="w-full max-h-[20vh] object-contain block"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/opt:bg-black/20 transition-colors flex items-center justify-center">
                                                                        <span className="opacity-0 group-hover/opt:opacity-100 text-white text-[9px] font-black uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded transition-opacity">
                                                                            Click to Change
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            const imgs = [...(q.optionImages || ['', '', '', ''])];
                                                                            imgs[optIndex] = '';
                                                                            handleQuestionChange(q.id, 'optionImages', imgs);
                                                                        }}
                                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow z-10"
                                                                    >
                                                                        <X className="h-2.5 w-2.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 group-hover/opt:text-primary uppercase tracking-widest transition-colors">
                                                                    <Image className="h-3 w-3" />
                                                                    <span>Add image to option</span>
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) handleOptionImageUpload(q.id, optIndex, e.target.files[0]);
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Ground Truth (for AI Evaluation)</label>
                                                    <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        <span>{getModelDisplayName()} Enabled</span>
                                                    </div>
                                                </div>
                                                <textarea
                                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 p-4 text-sm font-bold h-32 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 transition-all italic"
                                                    placeholder="Define the ideal answer or mission-critical keywords. AI evaluation will leverage this semantic anchor..."
                                                    value={q.referenceAnswer || ''}
                                                    onChange={(e) => handleQuestionChange(q.id, 'referenceAnswer', e.target.value)}
                                                />
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center gap-2 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Yield:</span>
                                            <input
                                                type="number"
                                                className="w-16 rounded-lg border border-gray-300 dark:border-slate-800 p-1.5 text-sm text-center font-black focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                                value={q.points}
                                                onChange={(e) => handleQuestionChange(q.id, 'points', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-between mt-8">
                                    <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </Button>
                                    <Button onClick={() => setStep(3)} className="gap-2">
                                        Next: Review <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-8"
                            >
                                <div className="text-center mb-8">
                                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-success" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Ready to Publish?</h2>
                                    <p className="text-gray-500 dark:text-slate-400">Review your exam details before making it live.</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8 space-y-4 border border-gray-100 dark:border-slate-700">
                                    <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                        <span className="text-gray-500 dark:text-slate-400">Title</span>
                                        <span className="font-medium text-gray-900 dark:text-slate-100">{examData.title || 'Untitled Exam'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                        <span className="text-gray-500 dark:text-slate-400">Subject</span>
                                        <span className="font-medium text-gray-900 dark:text-slate-100">{examData.subject || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                        <span className="text-gray-500 dark:text-slate-400">Duration</span>
                                        <span className="font-medium text-gray-900 dark:text-slate-100">{examData.duration} mins</span>
                                    </div>

                                    {isAdaptive ? (
                                        <>
                                            <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                                <span className="text-gray-500 dark:text-slate-400">Mode</span>
                                                <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight flex items-center gap-1.5">
                                                    <Zap className="h-3.5 w-3.5" /> Adaptive (C.A.T.)
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                                <span className="text-gray-500 dark:text-slate-400">Topic</span>
                                                <span className="font-medium text-gray-900 dark:text-slate-100">{adaptiveConfig.topic || examData.subject}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                                <span className="text-gray-500 dark:text-slate-400">AI Question Pool</span>
                                                <span className="font-medium text-gray-900 dark:text-slate-100">{adaptiveConfig.questionPoolSize} × 3 tiers = {adaptiveConfig.questionPoolSize * 3} questions</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                                <span className="text-gray-500 dark:text-slate-400">Questions per Student</span>
                                                <span className="font-medium text-gray-900 dark:text-slate-100">{adaptiveConfig.questionsPerStudent}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                                <span className="text-gray-500 dark:text-slate-400">Total Questions</span>
                                                <span className="font-medium text-gray-900 dark:text-slate-100">{questions.length}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-4">
                                                <span className="text-gray-500 dark:text-slate-400">Total Points</span>
                                                <span className="font-medium text-gray-900 dark:text-slate-100">
                                                    {questions.reduce((acc, q) => acc + (q.points || 0), 0)}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-slate-400">Security Threshold</span>
                                        <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">
                                            {examData.proctoringConfig.violationThreshold} VIOLATIONS ALLOWED
                                        </span>
                                    </div>
                                </div>

                                {isAdaptive && (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-8">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">🧠 Adaptive Generation Notice</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                            Upon publishing, the AI will automatically generate {adaptiveConfig.questionPoolSize * 3} questions across Easy, Medium, and Hard tiers. This process runs in the background and takes ~30-60 seconds. Each student will receive a unique, personalized path of {adaptiveConfig.questionsPerStudent} questions.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={() => setStep(isAdaptive ? 1 : 2)} className="gap-2" disabled={loading}>
                                        <ArrowLeft className="h-4 w-4" /> {isAdaptive ? 'Back to Configuration' : 'Back to Questions'}
                                    </Button>
                                    <div className="flex flex-col gap-3 w-full md:w-auto">
                                        <Button
                                            variant="success"
                                            onClick={handlePublish}
                                            className="gap-2 px-10 py-4 text-sm font-black hover:scale-105 transition-all shadow-2xl shadow-emerald-500/40"
                                            disabled={loading}
                                        >
                                            {loading && !saveAsNew ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    'Saving Changes...'
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    {editId && !cloneId ? 'Save & Update Existing' : 'Publish Exam Now'}
                                                </>
                                            )}
                                        </Button>

                                        {editId && !cloneId && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSaveAsNew(true);
                                                    setTimeout(handlePublish, 100);
                                                }}
                                                className="gap-2 px-10 py-4 text-sm font-black border-2 border-amber-500 text-amber-600 hover:bg-amber-50 transition-all uppercase tracking-widest shadow-xl shadow-amber-500/10"
                                                disabled={loading}
                                            >
                                                {loading && saveAsNew ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                                                        Cloning...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap className="h-5 w-5" />
                                                        Clone & Publish as New
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div >

            {/* AI Question Generator Modal */}
            {
                showAIGenerator && (
                    <AIGeneratorModal
                        subject={examData.subject}
                        onGenerate={handleAIGenerated}
                        onClose={() => setShowAIGenerator(false)}
                    />
                )
            }
        </>
    );
}

