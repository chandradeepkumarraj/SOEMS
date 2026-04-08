import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Cpu, Zap, ShieldAlert, AlertCircle, ChevronRight, MessageSquare, X } from 'lucide-react';
import { TFunction } from 'i18next';
import { useAIStatus } from '../../hooks/useAIStatus';
import { getNextAdaptiveQuestion, submitAdaptiveAnswer, submitExam } from '../../services/examService';
import { ExamHeader } from './ExamHeader';
import { NavigateFunction } from 'react-router-dom';

interface AdaptiveExamViewProps {
    examId: string;
    examTitle: string;
    timeLeft: number;
    navigate: NavigateFunction;
    violationCount: number;
    syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
    socketConnected: boolean;
    setSyncStatus: (status: 'idle' | 'syncing' | 'saved' | 'error') => void;
    formatTime: (s: number) => string;
    isPausedRef: React.MutableRefObject<boolean>;
    submittingRef: React.MutableRefObject<boolean>;
    t: TFunction;
}

export const AdaptiveExamView: React.FC<AdaptiveExamViewProps> = ({
    examId, examTitle, timeLeft, navigate, violationCount,
    syncStatus, socketConnected, setSyncStatus, formatTime, isPausedRef, submittingRef, t
}) => {
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
                return;
            }
            if (data.generating) {
                setGenerating(true);
                setTimeout(() => fetchNext(), 5000);
            } else if (data.completed) {
                setGenerating(false);
                setCompleted(true);
                try {
                    await submitExam(examId, []);
                } catch (e: any) {
                    console.warn('Auto-submit already handled:', e.message);
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
            if (status === 404) {
                alert('Your exam session has been terminated. Redirecting to dashboard.');
                navigate('/dashboard');
                return;
            }
            setAdaptiveError(msg);
            setTimeout(() => fetchNext(), 5000);
        } finally {
            setAdaptiveLoading(false);
        }
    };

    const handleAnswer = async () => {
        if (!currentQ || (currentQ.type === 'descriptive' && !textAnswer.trim()) || (currentQ.type !== 'descriptive' && selectedOption === null)) return;

        try {
            setSyncStatus('syncing');
            const result = await submitAdaptiveAnswer(examId, currentQ._id, selectedOption as number, textAnswer);
            setSyncStatus('saved');
            setFeedback({ isCorrect: result.isCorrect, newDifficulty: result.newDifficulty });
            setStats(prev => ({ ...prev, answered: prev.answered + 1, correct: result.isCorrect ? prev.correct + 1 : prev.correct }));
            setTimeout(() => fetchNext(), 1500);
        } catch (err: any) {
            console.error('Submit adaptive answer error:', err);
            setSyncStatus('error');
        }
    };

    useEffect(() => { fetchNext(); }, []);

    useEffect(() => {
        if (timeLeft <= 0 && !completed) {
            if (submittingRef.current) return;
            setCompleted(true);
            (async () => {
                try {
                    isPausedRef.current = true;
                    setSyncStatus('syncing');
                    await submitExam(examId, []);
                    setSyncStatus('saved');
                } catch (e: any) {
                    setSyncStatus('error');
                    alert('Submission failed. Please click "Check Status" or try to reload.');
                }
                navigate('/dashboard');
            })();
        }
    }, [timeLeft, completed, examId, navigate]);

    const difficultyColors: Record<string, string> = {
        easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    };

    if (adaptiveError && adaptiveError.toLowerCase().includes('session')) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-lg w-full shadow-2xl border border-red-500/30">
                    <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Internal Pipeline Error</h2>
                    <p className="text-slate-500 mb-8">{adaptiveError}</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full h-12">Return to Hub</Button>
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
                        <p className="text-slate-400 text-sm font-bold">{getModelDisplayName()} is generating your unique question pool.</p>
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
            <ExamHeader
                title={examTitle}
                isAdaptive
                timeLeft={timeLeft}
                syncStatus={syncStatus}
                socketConnected={socketConnected}
                violationCount={violationCount}
                formatTime={formatTime}
                t={t}
                isOnline={true}
                onSidebarToggle={() => {}}
                onFinish={() => {}}
                onFullscreen={() => {}}
                showFullscreenButton={false}
                submitting={false}
            />

            <div className="flex-1 overflow-y-auto pb-32">
                <div className="max-w-4xl mx-auto px-6 pt-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                Question {currentQ?.questionNumber || '...'}
                            </span>
                            {currentQ && (
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${difficultyColors[currentQ.currentDifficulty] || difficultyColors.medium}`}>
                                    {currentQ.currentDifficulty} Level
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Engine Activity</span>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`h-1 w-4 rounded-full ${i <= (currentQ?.currentDifficulty === 'easy' ? 2 : currentQ?.currentDifficulty === 'medium' ? 3 : 5) ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {adaptiveLoading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                                <div className="space-y-3">
                                    <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse w-3/4"></div>
                                    <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse w-1/2"></div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key={currentQ?._id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-10">{currentQ?.text}</p>
                                    
                                    {currentQ?.type === 'mcq' ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {currentQ.options.map((option: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => !feedback && setSelectedOption(idx)}
                                                    disabled={!!feedback}
                                                    className={`group relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                                                        selectedOption === idx 
                                                        ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                                    }`}
                                                >
                                                    <span className={`text-base font-bold ${selectedOption === idx ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{option}</span>
                                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedOption === idx ? 'border-primary bg-primary text-white' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'}`}>
                                                        {selectedOption === idx && <Zap className="h-3 w-3 fill-current" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('exam.descriptive_answer')}</label>
                                                <div className="flex items-center gap-2 text-indigo-500 font-black text-[9px] uppercase tracking-widest">
                                                    <MessageSquare className="h-3 w-3" /> Semantic Analysis Active
                                                </div>
                                            </div>
                                            <textarea
                                                value={textAnswer}
                                                onChange={(e) => setTextAnswer(e.target.value)}
                                                disabled={!!feedback}
                                                placeholder={t('exam.type_answer')}
                                                className="w-full h-48 bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 focus:border-primary outline-none text-slate-900 dark:text-slate-100 font-bold transition-all resize-none shadow-inner"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button 
                                        size="lg"
                                        onClick={handleAnswer} 
                                        disabled={!!feedback || (currentQ?.type === 'mcq' ? selectedOption === null : !textAnswer.trim())}
                                        className="gap-3 px-12 h-14 rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <span className="font-black uppercase tracking-widest">{t('exam.submit_next')}</span>
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>

                                {feedback && (
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-4 rounded-xl border flex items-center gap-3 ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        <AlertCircle className="h-5 w-5" />
                                        <span className="text-sm font-bold italic">{feedback.isCorrect ? 'Excellent answer. Increasing difficulty level for next challenge.' : 'Answer mapped. Re-adjusting difficulty to optimize calibration.'}</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Floating Stats */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl px-2 py-2 rounded-2xl border border-white/10 shadow-2xl z-40">
                <div className="flex items-center gap-3 px-4 h-12 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibration Phase</span>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-6 rounded-full ${i <= (stats.answered / stats.total * 3) ? 'bg-primary' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div className="flex items-center gap-3 px-4 h-12">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Accuracy Tracker</span>
                        <span className="text-sm font-black text-white">{Math.round(stats.correct / (stats.answered || 1) * 100)}%</span>
                     </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.confirm(t('exam.confirm_exit')) && navigate('/dashboard')} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-2">
                    <X className="h-4 w-4" /> Exit
                </Button>
            </div>
        </div>
    );
};
