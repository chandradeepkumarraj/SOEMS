import { motion } from 'framer-motion';
import { ShieldAlert, Monitor, Camera, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DeviceStatusProps {
    label: string;
    icon: React.ElementType;
    active: boolean;
}

const DeviceStatus = ({ label, icon: Icon, active }: DeviceStatusProps) => (
    <div className="flex items-center gap-2" title={label}>
        <div className={`p-1.5 rounded-lg ${active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
            <Icon className="h-4 w-4" />
        </div>
    </div>
);

interface SessionData {
    _id: string; // Internal MongoDB ID
    studentId?: {
        _id: string;
        name: string;
    };
    examId?: {
        _id: string;
        title: string;
    };
    violationCount?: number;
    status: 'in-progress' | 'completed';
    isSuspended: boolean;
    isOnline?: boolean;
    startTime: string;
    flagged?: Map<string, boolean> | Record<string, boolean>;
}

interface CandidateCardProps {
    session: SessionData;
    onResume?: (examId: string, studentId: string) => void;
}

export const CandidateCard = ({ session, onResume }: CandidateCardProps) => {
    const studentName = session.studentId?.name || 'Unknown Student';
    const examTitle = session.examId?.title || 'Unknown Exam';
    const vCount = session.violationCount || 0;
    const examId = session.examId?._id || session.examId;
    const studentId = session.studentId?._id || session.studentId;

    // Device telemetry fallback from flagged map
    const flaggedMap = session.flagged instanceof Map ? Object.fromEntries(session.flagged) : (session.flagged || {});
    const devices = {
        camera: !flaggedMap['camera_off'],
        screen: !flaggedMap['screen_off'],
        audio: !flaggedMap['mic_off']
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all ${session.isSuspended ? 'border-red-500 shadow-red-100' :
                session.status === 'completed' ? 'border-blue-500/50 bg-blue-50/10' :
                vCount > 10 ? 'border-orange-500' :
                vCount > 5 ? 'border-amber-400' :
                'border-slate-200 dark:border-slate-800'
                }`}
        >
        <div className="p-5">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${session.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        {studentName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        {session.isSuspended ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border border-red-200">Suspended</span>
                        ) : session.status === 'completed' ? (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-sm flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Finished
                            </span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${session.isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {session.isOnline ? 'Active' : 'Offline'}
                            </span>
                        )}
                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{examTitle}</p>
                    </div>
                </div>
                {/* HEI Trust Score (Derived from violation count) */}
                <div className="text-right shrink-0">
                    <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border dark:border-slate-700 ${vCount > 10 ? 'bg-red-50 text-red-600' :
                        vCount > 5 ? 'bg-amber-50 text-amber-500' :
                            'bg-emerald-50 text-emerald-500'
                        }`}>
                        <span className="text-lg font-black">{vCount}</span>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Violations</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                        {Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000)}m
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                        <ShieldAlert className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Hardware</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <DeviceStatus label="Camera" icon={Camera} active={devices.camera} />
                        <DeviceStatus label="Screen" icon={Monitor} active={devices.screen} />
                        <DeviceStatus label="Audio" icon={MessageSquare} active={devices.audio} />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                    to={`/proctor/monitor/${examId}/${studentId}`}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Live View
                </Link>
                {session.isSuspended && onResume && examId && studentId && (
                    <button
                        onClick={() => onResume(examId as string, studentId as string)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        Resume
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);
};
