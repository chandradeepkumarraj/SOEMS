import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Wind, Moon, Sun, Zap, ShieldCheck, Activity } from 'lucide-react';

interface PhysiologyShieldProps {
    avgScore: number;
    userName?: string;
}

export default function PhysiologyShield({ avgScore }: PhysiologyShieldProps) {
    const [isBreathing, setIsBreathing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [breathState, setBreathState] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [countdown, setCountdown] = useState(4);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let interval: any;
        if (isBreathing) {
            interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (breathState === 'Inhale') {
                            setBreathState('Hold');
                            return 4;
                        } else if (breathState === 'Hold') {
                            setBreathState('Exhale');
                            return 4;
                        } else {
                            setBreathState('Inhale');
                            return 4;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setCountdown(4);
            setBreathState('Inhale');
        }
        return () => clearInterval(interval);
    }, [isBreathing, breathState]);

    const getCircadianInfo = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 11) return {
            label: 'Morning Peak',
            sub: 'Best Time for Learning',
            icon: Sun,
            color: 'text-amber-500',
            glow: 'shadow-amber-500/20',
            desc: 'Ideal for declarative memory and complex logic.'
        };
        if (hour >= 11 && hour < 16) return {
            label: 'Processing Phase',
            sub: 'High Energy Focus',
            icon: Zap,
            color: 'text-cyan-500',
            glow: 'shadow-cyan-500/20',
            desc: 'Optimal for active problem solving and application.'
        };
        if (hour >= 16 && hour < 21) return {
            label: 'Consolidation',
            sub: 'Review & Remember',
            icon: Wind,
            color: 'text-indigo-500',
            glow: 'shadow-indigo-500/20',
            desc: 'Perfect for synthesizing knowledge and review.'
        };
        return {
            label: 'Rest & Deep Sleep',
            sub: 'Brain Recovery Active',
            icon: Moon,
            color: 'text-fuchsia-500',
            glow: 'shadow-fuchsia-500/20',
            desc: 'Prioritize REM sleep for long-term memory solidification.'
        };
    };

    const circadian = getCircadianInfo();
    const PowerIcon = circadian.icon;
    const brainPower = Math.min(100, Math.max(10, avgScore + 20));

    return (
        <div className="space-y-6">
            {/* Ecstatic Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-primary to-transparent rounded-full" />
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Performance Hub</h2>
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" /> Live Brain Monitoring
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-mono font-black text-slate-500">STATUS: OPTIMIZED</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brain Power - Glassmorphism 2.0 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="relative p-8 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/50 shadow-2xl overflow-hidden group"
                >
                    {/* Animated Mesh Gradients */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[100px]" />

                    <div className="relative z-10 flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Concentration Level</h3>
                            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">Brain Readiness</p>
                        </div>
                        <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <Brain className="h-5 w-5 text-primary" />
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-8">
                        <div className="relative h-28 w-28 scale-110">
                            <svg className="h-full w-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                                <circle cx="56" cy="56" r="48" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-slate-200/50 dark:text-slate-800" />
                                <motion.circle
                                    cx="56"
                                    cy="56"
                                    r="48"
                                    fill="transparent"
                                    stroke="url(#gradient)"
                                    strokeWidth="12"
                                    strokeDasharray={301.6}
                                    initial={{ strokeDashoffset: 301.6 }}
                                    animate={{ strokeDashoffset: 301.6 - (301.6 * brainPower) / 100 }}
                                    transition={{ duration: 2, ease: "circOut" }}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{brainPower}%</span>
                                <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-[-4px]">Current Power</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Focus: Sharp
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold leading-relaxed">
                                    Your {avgScore}% average shows your brain is primed for complex problem-solving right now.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-1 w-8 rounded-full bg-primary" />
                                <div className="h-1 w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="h-1 w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Circadian & Stress Buster - Glassmorphism 2.0 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ delay: 0.1 }}
                    className="relative p-8 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/50 shadow-2xl flex flex-col justify-between overflow-hidden group"
                >
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div className={`p-4 rounded-[1.5rem] bg-white dark:bg-slate-800 shadow-lg ${circadian.glow} border border-slate-100 dark:border-slate-700`}>
                                <PowerIcon className={`h-8 w-8 ${circadian.color}`} />
                            </div>
                            <div className="text-right">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Study Rhythm</h4>
                                <p className={`text-sm font-black ${circadian.color} tracking-tight`}>{circadian.label}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h5 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-2">{circadian.sub}</h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold leading-relaxed">
                                {circadian.desc}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                        <button
                            onClick={() => setIsBreathing(!isBreathing)}
                            className={`group h-14 px-6 rounded-2xl transition-all duration-500 flex items-center gap-3 active:scale-95 ${isBreathing
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/20'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg'
                                }`}
                        >
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${isBreathing ? 'bg-white/10 dark:bg-slate-100' : 'bg-slate-100 dark:bg-slate-900'}`}>
                                <Wind className={`h-4 w-4 ${isBreathing ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {isBreathing ? 'Breathe: ON' : 'Stress Buster'}
                            </span>
                        </button>

                        <AnimatePresence>
                            {isBreathing && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-950/30 px-5 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-900"
                                >
                                    <div className="relative">
                                        <motion.div
                                            animate={{ scale: [1, 1.8, 1] }}
                                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                            className="h-6 w-6 rounded-full bg-emerald-200 dark:bg-emerald-800 blur-sm"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] leading-none mb-1">
                                            {breathState}
                                        </p>
                                        <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest leading-none">
                                            Hold for {countdown}s
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Background Texture Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                </motion.div>
            </div>
        </div>
    );
}
