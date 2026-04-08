import React from 'react';
import { Clock, ShieldAlert, Zap, Menu, MonitorOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface ExamHeaderProps {
    title: string;
    isAdaptive?: boolean;
    timeLeft: number;
    syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
    isOnline?: boolean;
    socketConnected: boolean;
    violationCount: number;
    formatTime: (seconds: number) => string;
    onSidebarToggle?: () => void;
    onFinish?: () => void;
    onFullscreen?: () => void;
    showFullscreenButton?: boolean;
    submitting?: boolean;
    t: (key: string) => string;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
    title,
    isAdaptive,
    timeLeft,
    syncStatus,
    isOnline = true,
    socketConnected,
    violationCount,
    formatTime,
    onSidebarToggle,
    onFinish,
    onFullscreen,
    showFullscreenButton,
    submitting,
    t
}) => {
    return (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-20 sticky top-0">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {!isAdaptive && onSidebarToggle && (
                    <button
                        onClick={onSidebarToggle}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
                        aria-label="Toggle Navigator"
                    >
                        <Menu className="h-6 w-6 text-gray-600 dark:text-slate-400" />
                    </button>
                )}
                <div className="flex flex-col min-w-0">
                    <h1 className="text-lg font-black text-gray-900 dark:text-slate-100 truncate uppercase tracking-tight">
                        {title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 pt-0.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                {syncStatus === 'syncing' ? t('exam.syncing') : syncStatus === 'error' ? 'Sync Error' : t('exam.saved')}
                            </span>
                        </div>
                        <div className="w-px h-2 bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${isOnline && socketConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline && socketConnected ? 'text-gray-400' : 'text-red-500 font-black'}`}>
                                {isOnline && socketConnected ? t('exam.live_connection') : t('exam.disconnected')}
                            </span>
                        </div>
                        {isAdaptive && (
                            <>
                                <div className="w-px h-2 bg-slate-200 dark:bg-slate-800"></div>
                                <div className="flex items-center gap-1.5 text-amber-500">
                                    <Zap className="h-3 w-3 fill-current" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Adaptive Mode</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
                {violationCount > 0 && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800"
                    >
                        <ShieldAlert className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{violationCount} Integrity Warnings</span>
                    </motion.div>
                )}

                {showFullscreenButton && onFullscreen && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30 animate-pulse"
                        onClick={onFullscreen}
                    >
                        <MonitorOff className="h-4 w-4 mr-2" />
                        {t('exam.go_fullscreen')}
                    </Button>
                )}

                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-lg tabular-nums tracking-tighter ${
                    timeLeft < 300 ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-100 dark:border-red-900/30 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-inner'
                }`}>
                    <Clock className="h-5 w-5" />
                    <span>{formatTime(timeLeft)}</span>
                </div>

                {!isAdaptive && onFinish && (
                    <Button
                        variant="error"
                        size="sm"
                        className="hidden sm:flex font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-red-500/20"
                        onClick={onFinish}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Finish Exam'}
                    </Button>
                )}
            </div>
        </header>
    );
};
