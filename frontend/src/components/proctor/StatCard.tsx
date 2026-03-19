import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
}

export const StatCard = ({ label, value, icon: Icon, color }: StatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
    >
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700 ${color}`} />
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</h3>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-opacity-20 ${color} bg-opacity-10`}>
                <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
        <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
    </motion.div>
);
