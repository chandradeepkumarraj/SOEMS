import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, CheckCircle2, FileText, ShieldAlert } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { createQuestion } from '../services/questionService';
import { createExam, getExamById, updateExam } from '../services/examService';
import { getGroups, getSubgroups } from '../services/adminService';
import { useEffect } from 'react';

interface Question {
    id: number;
    text: string;
    options: string[];
    correctOption: number;
    points: number;
    difficulty: string;
}

export default function CreateExam() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

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
        resultsPublished: false,
        proctoringConfig: {
            enableTabLock: true,
            enableFullscreen: true,
            enableInputLock: true,
            violationThreshold: 5
        }
    });

    const [groups, setGroups] = useState<any[]>([]);
    const [subgroups, setSubgroups] = useState<any[]>([]);

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const groupsData = await getGroups();
                setGroups(groupsData);
            } catch (error) {
                console.error('Failed to fetch groups:', error);
            }
        };
        fetchHierarchy();
    }, []);

    const fetchSubgroupsForGroup = async (groupId: string) => {
        try {
            const data = await getSubgroups(groupId);
            setSubgroups(data);
        } catch (error) {
            console.error('Failed to fetch subgroups:', error);
        }
    };

    const [questions, setQuestions] = useState<Question[]>([
        { id: 1, text: '', options: ['', '', '', ''], correctOption: 0, points: 1, difficulty: 'medium' }
    ]);

    useEffect(() => {
        if (editId) {
            const fetchExam = async () => {
                try {
                    const exam = await getExamById(editId);
                    const start = new Date(exam.startTime);

                    setExamData({
                        title: exam.title,
                        description: exam.description || '',
                        instructions: exam.description || '',
                        subject: exam.questions?.[0]?.subject || '',
                        duration: exam.duration.toString(),
                        date: start.toISOString().split('T')[0],
                        time: start.toTimeString().slice(0, 5),
                        allowedGroups: exam.allowedGroups || [],
                        allowedSubgroups: exam.allowedSubgroups || [],
                        resultsPublished: exam.resultsPublished || false,
                        proctoringConfig: exam.proctoringConfig || {
                            enableTabLock: true,
                            enableFullscreen: true,
                            enableInputLock: true,
                            violationThreshold: 5
                        }
                    } as any);

                    if (exam.allowedGroups && exam.allowedGroups.length === 1) {
                        fetchSubgroupsForGroup(exam.allowedGroups[0]);
                    }

                    if (exam.questions) {
                        setQuestions(exam.questions.map((q: any, i: number) => ({
                            id: i + 1,
                            text: q.text,
                            options: q.options,
                            correctOption: q.correctAnswer,
                            points: 1,
                            difficulty: q.difficulty || 'medium'
                        })));
                    }
                } catch (error) {
                    console.error('Failed to load exam for editing:', error);
                }
            };
            fetchExam();
        }
    }, [editId]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            { id: questions.length + 1, text: '', options: ['', '', '', ''], correctOption: 0, points: 1, difficulty: 'medium' }
        ]);
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
        if (questions.length === 0) {
            alert('Please add at least one question.');
            return;
        }
        if (examData.proctoringConfig.violationThreshold < 1) {
            alert('Security Threshold must be at least 1.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create all questions
            const questionIds = [];
            for (const q of questions) {
                const questionData = {
                    text: q.text,
                    options: q.options,
                    correctAnswer: q.correctOption,
                    subject: examData.subject,
                    difficulty: q.difficulty || 'medium'
                };
                const savedQuestion = await createQuestion(questionData);
                questionIds.push(savedQuestion._id);
            }

            // 2. Create Exam
            const startDateTime = new Date(`${examData.date}T${examData.time}`);
            const durationMinutes = parseInt(examData.duration);
            const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

            const finalExamData = {
                title: examData.title,
                description: examData.instructions,
                questions: questionIds,
                duration: durationMinutes,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                status: 'published',
                resultsPublished: examData.resultsPublished,
                allowedGroups: examData.allowedGroups,
                allowedSubgroups: examData.allowedSubgroups,
                proctoringConfig: examData.proctoringConfig
            };

            if (editId) {
                await updateExam(editId, finalExamData);
            } else {
                await createExam(finalExamData);
            }
            navigate('/teacher/exams'); // Navigate to My Exams list instead of dashboard for better flow
        } catch (error) {
            console.error('Failed to publish exam:', error);
            alert('Failed to publish exam. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
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
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Candidate Matrix Eligibility</label>
                                        <div className="flex flex-wrap gap-2">
                                            {groups.map(g => (
                                                <button
                                                    key={g._id}
                                                    type="button"
                                                    onClick={() => {
                                                        const isSelected = examData.allowedGroups.includes(g._id);
                                                        const newGroups = isSelected
                                                            ? examData.allowedGroups.filter(id => id !== g._id)
                                                            : [...examData.allowedGroups, g._id];
                                                        setExamData({ ...examData, allowedGroups: newGroups, allowedSubgroups: [] });
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
                                <div className="md:col-span-2 border-t-2 border-slate-200 dark:border-slate-800 pt-8 mt-4">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                                        <ShieldAlert className="h-5 w-5 text-primary" /> Sentinel Protocols
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                id="tabLock"
                                                checked={examData.proctoringConfig.enableTabLock}
                                                onChange={(e) => setExamData({
                                                    ...examData,
                                                    proctoringConfig: { ...examData.proctoringConfig, enableTabLock: e.target.checked }
                                                })}
                                                className="mt-1 h-4 w-4 text-primary rounded border-gray-300 dark:border-slate-800 focus:ring-primary bg-white dark:bg-slate-950"
                                            />
                                            <label htmlFor="tabLock" className="cursor-pointer">
                                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Tab Lock</span>
                                                <span className="text-[10px] text-gray-500 dark:text-slate-500">Detect tab/window switching</span>
                                            </label>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                id="fullscreen"
                                                checked={examData.proctoringConfig.enableFullscreen}
                                                onChange={(e) => setExamData({
                                                    ...examData,
                                                    proctoringConfig: { ...examData.proctoringConfig, enableFullscreen: e.target.checked }
                                                })}
                                                className="mt-1 h-4 w-4 text-primary rounded border-gray-300 dark:border-slate-800 focus:ring-primary bg-white dark:bg-slate-950"
                                            />
                                            <label htmlFor="fullscreen" className="cursor-pointer">
                                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Force Fullscreen</span>
                                                <span className="text-[10px] text-gray-500 dark:text-slate-500">Exam must be in fullscreen</span>
                                            </label>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                id="inputLock"
                                                checked={examData.proctoringConfig.enableInputLock}
                                                onChange={(e) => setExamData({
                                                    ...examData,
                                                    proctoringConfig: { ...examData.proctoringConfig, enableInputLock: e.target.checked }
                                                })}
                                                className="mt-1 h-4 w-4 text-primary rounded border-gray-300 dark:border-slate-800 focus:ring-primary bg-white dark:bg-slate-950"
                                            />
                                            <label htmlFor="inputLock" className="cursor-pointer">
                                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Input Lockdown</span>
                                                <span className="text-[10px] text-gray-500 dark:text-slate-500">Block Ctrl+C, Ctrl+V, etc.</span>
                                            </label>
                                        </div>
                                        <div className="md:col-span-3 flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100/50 dark:border-red-900/20">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                                    <ShieldAlert className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900 dark:text-slate-100 block">Enforcement Threshold</span>
                                                    <span className="text-xs text-gray-500 dark:text-slate-400">Maximum violations allowed before auto-submission and suspension.</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-1 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={examData.proctoringConfig.violationThreshold}
                                                    onChange={(e) => setExamData({
                                                        ...examData,
                                                        proctoringConfig: { ...examData.proctoringConfig, violationThreshold: parseInt(e.target.value) || 1 }
                                                    })}
                                                    className="w-16 text-center font-black text-red-600 dark:text-red-400 bg-transparent focus:outline-none text-lg"
                                                />
                                                <span className="text-[10px] font-black text-red-400 dark:text-red-500 uppercase tracking-widest pr-2">Chances</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button onClick={() => setStep(2)} className="gap-2">
                                    Next: Add Questions <ArrowRight className="h-4 w-4" />
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
                                <Button onClick={handleAddQuestion} variant="outline" className="gap-2 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-800">
                                    <Plus className="h-4 w-4" /> Add Question
                                </Button>
                            </div>

                            {questions.map((q, qIndex) => (
                                <div key={q.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 relative group">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="p-2 text-gray-400 dark:text-slate-500 hover:text-error hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="mb-4 pr-10">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                                            Question {qIndex + 1}
                                        </label>
                                        <textarea
                                            className="w-full rounded-lg border border-gray-300 dark:border-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                                            placeholder="Type your question here..."
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, optIndex) => (
                                            <div key={optIndex} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={`correct-${q.id}`}
                                                    checked={q.correctOption === optIndex}
                                                    onChange={() => handleQuestionChange(q.id, 'correctOption', optIndex)}
                                                    className="h-4 w-4 text-primary focus:ring-primary"
                                                />
                                                <Input
                                                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(q.id, optIndex, e.target.value)}
                                                    className="mb-0"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 justify-end">
                                        <span className="text-sm text-gray-500 dark:text-slate-400">Points:</span>
                                        <input
                                            type="number"
                                            className="w-16 rounded-lg border border-gray-300 dark:border-slate-800 p-1.5 text-sm text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
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
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400">Security Threshold</span>
                                    <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">
                                        {examData.proctoringConfig.violationThreshold} VIOLATIONS ALLOWED
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)} className="gap-2" disabled={loading}>
                                    <ArrowLeft className="h-4 w-4" /> Back to Questions
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={handlePublish}
                                    className="gap-2 px-10 py-4 text-sm font-black hover:scale-105 transition-all shadow-2xl shadow-emerald-500/40"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5" /> Publish Exam
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div >
    );
}
