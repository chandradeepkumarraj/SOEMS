import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, CheckCircle2, FileText } from 'lucide-react';
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
        resultsPublished: false
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
                        resultsPublished: exam.resultsPublished || false
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
                allowedSubgroups: examData.allowedSubgroups
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Link to="/teacher/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2 pl-0 hover:bg-transparent">
                            <ArrowLeft className="h-5 w-5" /> Exit
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-gray-200" />
                    <h1 className="text-lg font-bold text-gray-900">Create New Exam</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mr-4">
                        <span className={step >= 1 ? 'text-primary font-medium' : ''}>1. Details</span>
                        <span className="text-gray-300">/</span>
                        <span className={step >= 2 ? 'text-primary font-medium' : ''}>2. Questions</span>
                        <span className="text-gray-300">/</span>
                        <span className={step >= 3 ? 'text-primary font-medium' : ''}>3. Review</span>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
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
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Exam Details
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
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-gray-700">Assign to Groups (Target Audience)</label>
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
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${examData.allowedGroups.includes(g._id)
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                                                        }`}
                                                >
                                                    {g.name}
                                                </button>
                                            ))}
                                            {groups.length === 0 && <span className="text-xs text-gray-400 italic">No groups available. Creating as public exam.</span>}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions</label>
                                    <textarea
                                        className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[100px]"
                                        placeholder="Enter exam instructions for students..."
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
                                            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Publish results automatically after exam ends</span>
                                    </label>
                                    <p className="text-xs text-gray-500 ml-6">If enabled, students can view their scores and detailed answers immediately after the exam window closes.</p>
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
                                <h2 className="text-xl font-bold text-gray-900">Questions Builder</h2>
                                <Button onClick={handleAddQuestion} variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Question
                                </Button>
                            </div>

                            {questions.map((q, qIndex) => (
                                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="p-2 text-gray-400 hover:text-error hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="mb-4 pr-10">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Question {qIndex + 1}
                                        </label>
                                        <textarea
                                            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                                        <span className="text-sm text-gray-500">Points:</span>
                                        <input
                                            type="number"
                                            className="w-16 rounded-lg border border-gray-300 p-1.5 text-sm text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-success" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Ready to Publish?</h2>
                                <p className="text-gray-500">Review your exam details before making it live.</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-8 space-y-4">
                                <div className="flex justify-between border-b border-gray-200 pb-4">
                                    <span className="text-gray-500">Title</span>
                                    <span className="font-medium text-gray-900">{examData.title || 'Untitled Exam'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-4">
                                    <span className="text-gray-500">Subject</span>
                                    <span className="font-medium text-gray-900">{examData.subject || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-4">
                                    <span className="text-gray-500">Duration</span>
                                    <span className="font-medium text-gray-900">{examData.duration} mins</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-4">
                                    <span className="text-gray-500">Total Questions</span>
                                    <span className="font-medium text-gray-900">{questions.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Points</span>
                                    <span className="font-medium text-gray-900">
                                        {questions.reduce((acc, q) => acc + (q.points || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)} className="gap-2" disabled={loading}>
                                    <ArrowLeft className="h-4 w-4" /> Back to Questions
                                </Button>
                                <Button onClick={handlePublish} className="gap-2 bg-success hover:bg-green-600" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" /> Publish Exam
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
