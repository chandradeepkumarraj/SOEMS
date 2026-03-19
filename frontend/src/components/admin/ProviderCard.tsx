import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { AIProviderConfig } from '../../config/aiConfig';

interface ProviderCardProps {
    provider: AIProviderConfig;
    isActive: boolean;
    isEnabled: boolean;
    onClick: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, isActive, isEnabled, onClick }) => {
    const colorMap: Record<string, string> = {
        emerald: 'emerald',
        blue: 'blue',
        red: 'red'
    };

    const color = colorMap[provider.color] || 'primary';

    return (
        <motion.div
            whileHover={isEnabled ? { y: -4 } : {}}
            whileTap={isEnabled ? { scale: 0.98 } : {}}
            onClick={onClick}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${isActive
                    ? `border-${color}-500 bg-${color}-50/50 dark:bg-${color}-900/10 shadow-lg shadow-${color}-500/10`
                    : 'border-[var(--border-main)] bg-[var(--card-bg)] opacity-70 hover:opacity-100'
                } ${!isEnabled ? 'grayscale contrast-75 opacity-50' : ''}`}
        >
            <div className={`absolute top-0 right-0 p-3 bg-${color}-500 text-white rounded-bl-xl transition-transform ${isActive ? 'translate-x-0' : 'translate-x-full'}`}>
                <ShieldCheck className="h-4 w-4" />
            </div>

            {!isEnabled && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md rotate-[-5deg] shadow-sm z-10">
                    Offline
                </div>
            )}

            <provider.icon className={`h-10 w-10 mb-4 transition-colors ${isActive ? `text-${color}-500` : 'text-slate-400'}`} />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-1 select-none">{provider.name}</h3>
            <p className="text-xs text-slate-500 font-bold select-none leading-relaxed line-clamp-2">{provider.desc}</p>
        </motion.div>
    );
};
