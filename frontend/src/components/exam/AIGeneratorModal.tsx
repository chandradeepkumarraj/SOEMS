import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, AlertTriangle, Cpu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { generateQuestionsWithAI } from '../../services/questionService';
import { useAIStatus } from '../../hooks/useAIStatus';

interface AIGeneratorModalProps {
    subject: string;
    onGenerate: (questions: any[]) => void;
    onClose: () => void;
}

export default function AIGeneratorModal({ subject, onGenerate, onClose }: AIGeneratorModalProps) {
    const { getModelDisplayName, provider } = useAIStatus();
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(10);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [type, setType] = useState<'mcq' | 'descriptive'>('mcq');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please specify a topic or focus area.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await generateQuestionsWithAI({
                subject: subject || 'General',
                topic,
                count,
                difficulty,
                type,
            });
            onGenerate(result.questions);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || `AI generation failed. Ensure your AI provider (${provider}) is reachable.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-main)] max-w-lg w-full overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">AI Question Generator</h3>
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Powered by {getModelDisplayName()}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Topic / Focus Area *</label>
                            <Input
                                placeholder="e.g., Data Structures, Photosynthesis, World War II..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Number of Questions</label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Difficulty Level</label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === d ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Question Type</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setType('mcq')}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${type === 'mcq' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}
                                >
                                    MCQ (Auto-Graded)
                                </button>
                                <button
                                    onClick={() => setType('descriptive')}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${type === 'descriptive' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}
                                >
                                    Descriptive (AI-Graded)
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                <span className="font-bold">{error}</span>
                            </div>
                        )}

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 py-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating {count} questions with AI...
                                </>
                            ) : (
                                <>
                                    <Cpu className="h-4 w-4" />
                                    Generate {count} Questions
                                </>
                            )}
                        </Button>

                        <p className="text-[10px] text-slate-400 text-center font-bold">
                            AI-generated questions will be added to your exam. You can review and edit them before publishing.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
