import { ToggleLeft, ToggleRight } from 'lucide-react';

interface PerformanceSliderProps {
    label: string;
    description: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    disabled?: boolean;
    unit?: string;
    variant?: 'compact' | 'standard';
}

export function PerformanceSlider({ 
    label, 
    description, 
    value, 
    min, 
    max, 
    step, 
    onChange, 
    disabled, 
    unit = "",
    variant = 'standard'
}: PerformanceSliderProps) {
    const isCompact = variant === 'compact';

    return (
        <div className={`space-y-3 ${disabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h5 className={`font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>{label}</h5>
                    <p className={`text-slate-400 font-bold italic ${isCompact ? 'text-[8px]' : 'text-[9px]'}`}>{description}</p>
                </div>
                <span className={`bg-primary/10 text-primary px-2 py-0.5 rounded font-black ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>{value}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className={`w-full bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all ${isCompact ? 'h-1' : 'h-1.5'}`}
            />
            <div className={`flex justify-between font-black text-slate-400 uppercase tracking-widest ${isCompact ? 'text-[7px] mt-1' : 'text-[8px]'}`}>
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
}

interface SentinelControlProps {
    icon: any;
    label: string;
    active: boolean;
    toggle: () => void;
    disabled?: boolean;
}

export function SentinelControl({ icon: Icon, label, active, toggle, disabled }: SentinelControlProps) {
    return (
        <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${active
                ? 'bg-primary/5 border-primary/20 ring-4 ring-primary/5 shadow-lg shadow-primary/5'
                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                } ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-primary text-white scale-110 rotate-3' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 group-hover:scale-105'}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {label}
                </span>
            </div>
            {active ? (
                <ToggleRight className="h-6 w-6 text-primary" />
            ) : (
                <ToggleLeft className="h-6 w-6 text-slate-300" />
            )}
        </button>
    );
}
