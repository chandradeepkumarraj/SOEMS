import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    text: string;
}

export const EmptyState = ({ icon: Icon, title, text }: EmptyStateProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center"
    >
        <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Icon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">{title}</h3>
        <p className="text-slate-500 font-medium max-w-xs">{text}</p>
    </motion.div>
);
