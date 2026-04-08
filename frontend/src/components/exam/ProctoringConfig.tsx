import React from 'react';
import { Button } from '../ui/Button';
import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

interface ProctoringConfigProps {
    config: {
        enableTabLock: boolean;
        enableFullscreen: boolean;
        enableInputLock: boolean;
        enableFaceDetection: boolean;
        enableVoiceDetection: boolean;
        enableGazeTracking: boolean;
        violationThreshold: number;
    };
    onChange: (field: string, value: any) => void;
    userProfile?: any;
    systemDefaults?: any;
}

export const ProctoringConfig: React.FC<ProctoringConfigProps> = ({ config, onChange, userProfile, systemDefaults }) => {
    return (
        <div className="md:col-span-2 border-t-2 border-slate-200 dark:border-slate-800 pt-8 mt-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-3 uppercase tracking-[0.2em]">
                    <ShieldAlert className="h-5 w-5 text-primary" /> Sentinel Protocols
                </h3>
                <div className="flex items-center gap-2">
                    {userProfile?.proctoringPresets && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange('all', userProfile.proctoringPresets)}
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 flex items-center gap-2"
                        >
                            <Zap className="h-3 w-3" /> Load My Preset
                        </Button>
                    )}
                    {systemDefaults?.proctoringDefaults && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange('all', systemDefaults.proctoringDefaults)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 flex items-center gap-2"
                        >
                            <ShieldCheck className="h-3 w-3" /> System Defaults
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Standard Security */}
                {[
                    { id: 'tabLock', label: 'Tab Lock', sublabel: 'Detect switching', field: 'enableTabLock' },
                    { id: 'fullscreen', label: 'Force Fullscreen', sublabel: 'Must stay fullscreen', field: 'enableFullscreen' },
                    { id: 'inputLock', label: 'Input Lockdown', sublabel: 'Block copy-paste', field: 'enableInputLock' },
                ].map(opt => (
                    <div key={opt.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <input
                            type="checkbox"
                            id={opt.id}
                            checked={(config as any)[opt.field]}
                            onChange={(e) => onChange(opt.field, e.target.checked)}
                            className="mt-1 h-4 w-4 text-primary rounded border-gray-300 dark:border-slate-800 focus:ring-primary bg-white dark:bg-slate-950"
                        />
                        <label htmlFor={opt.id} className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block">{opt.label}</span>
                            <span className="text-[10px] text-gray-500 dark:text-slate-500">{opt.sublabel}</span>
                        </label>
                    </div>
                ))}

                {/* AI Monitoring */}
                <div className="md:col-span-3 mt-2">
                    <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-indigo-500" />
                        AI Monitoring Modules
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                            <input
                                type="checkbox"
                                id="faceDetection"
                                checked={config.enableFaceDetection}
                                onChange={(e) => onChange('enableFaceDetection', e.target.checked)}
                                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-slate-800 focus:ring-blue-500 bg-white dark:bg-slate-950"
                            />
                            <label htmlFor="faceDetection" className="cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Face Detection (AI)</span>
                                <span className="text-[10px] text-gray-500 dark:text-slate-500">Multiple faces monitoring</span>
                            </label>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors">
                            <input
                                type="checkbox"
                                id="voiceDetection"
                                checked={config.enableVoiceDetection}
                                onChange={(e) => onChange('enableVoiceDetection', e.target.checked)}
                                className="mt-1 h-4 w-4 text-amber-600 rounded border-gray-300 dark:border-slate-800 focus:ring-amber-500 bg-white dark:bg-slate-950"
                            />
                            <label htmlFor="voiceDetection" className="cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Smart Listening</span>
                                <span className="text-[10px] text-gray-500 dark:text-slate-500">Detects talking/voices</span>
                            </label>
                        </div>
                        <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${config.enableFaceDetection ? 'border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20' : 'border-gray-100 dark:border-slate-800 opacity-50 cursor-not-allowed'}`}>
                            <input
                                type="checkbox"
                                id="gazeTracking"
                                checked={config.enableGazeTracking}
                                disabled={!config.enableFaceDetection}
                                onChange={(e) => onChange('enableGazeTracking', e.target.checked)}
                                className="mt-1 h-4 w-4 text-indigo-600 rounded border-gray-300 dark:border-slate-800 focus:ring-indigo-500 bg-white dark:bg-slate-950 disabled:opacity-50"
                            />
                            <label htmlFor="gazeTracking" className={`cursor-pointer ${!config.enableFaceDetection ? 'cursor-not-allowed' : ''}`}>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block">Look-Away Detection</span>
                                <span className="text-[10px] text-gray-500 dark:text-slate-500">Alert on screen diversion</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Violation Threshold */}
                <div className="md:col-span-3 flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100/50 dark:border-red-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-slate-100 block">Allowed Cheating Attempts</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400">Total warnings before auto-submission.</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-1 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm">
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={config.violationThreshold}
                            onChange={(e) => onChange('violationThreshold', parseInt(e.target.value) || 5)}
                            className="w-16 h-10 text-center font-black text-red-600 bg-transparent outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
