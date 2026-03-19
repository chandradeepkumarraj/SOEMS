import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, Zap, ChevronRight, BookOpen, BrainCircuit, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { getMyImprovementReport } from '../../services/resultService';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

export default function PerformanceMentor() {
    const { t } = useTranslation();
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyImprovementReport();
            setReport(data.report);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate mentor report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial check if we should auto-load or wait for click
        // For now, let's wait for click to save AI tokens unless user explicitly wants it
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between text-white relative overflow-hidden">
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{t('mentor.title')}</h2>
                        <p className="text-xs text-indigo-100 font-medium uppercase tracking-widest">{t('mentor.subtitle')}</p>
                    </div>
                </div>

                <AnimatePresence>
                    {!report && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={fetchReport}
                                className="bg-white/10 hover:bg-white/20 text-white border-none group"
                            >
                                <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                                {t('mentor.analyze')}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="relative">
                            <div className="h-16 w-16 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                            <div className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            <Sparkles className="h-6 w-6 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-1 italic">{t('mentor.scanning')}</p>
                            <p className="text-slate-500 text-sm">{t('mentor.synthesizing')}</p>
                        </div>
                    </div>
                ) : report ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                                <ReactMarkdown>{report}</ReactMarkdown>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-wrap gap-3">
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tight">
                                    <Target className="h-3 w-3" /> {t('mentor.focus_weak')}
                                </span>
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tight">
                                    <Zap className="h-3 w-3" /> {t('mentor.practice_high')}
                                </span>
                                {/* Neural Affirmations */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-3 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 rounded-full flex items-center gap-2"
                                >
                                    <Sparkles className="h-3 w-3 text-purple-500" />
                                    <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest">Neural Master</span>
                                </motion.div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchReport}
                                className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-2"
                            >
                                <RotateCcw className="h-3 w-3" /> {t('mentor.regenerate')}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center py-12 px-4 group cursor-pointer" onClick={fetchReport}>
                        <div className="relative inline-block mb-6">
                            <div className="h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                <BookOpen className="h-10 w-10 text-indigo-200 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/30">
                                <ChevronRight className="h-4 w-4 text-indigo-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('mentor.ready_title')}</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">
                            {t('mentor.ready_desc')}
                        </p>
                        {error && (
                            <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100">
                                {error}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
