import { LucideIcon } from 'lucide-react';

interface DeviceStatusProps {
    label: string;
    icon: LucideIcon | React.ElementType;
    active: boolean;
}

export const DeviceStatus = ({ label, icon: Icon, active }: DeviceStatusProps) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {active ? 'Active' : 'Offline'}
            </span>
        </div>
    </div>
);
