import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Trophy, Award, Medal, Cpu, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface BadgeExportProps {
    badge: {
        type: string;
        label: string;
        count: number;
        color: string;
        threshold: string;
    };
    studentName: string;
    onClose: () => void;
}

const BADGE_GRADIENTS: Record<string, string[]> = {
    ai_excellence: ['#7c3aed', '#a855f7', '#c084fc'],
    gold: ['#d97706', '#f59e0b', '#fbbf24'],
    silver: ['#475569', '#64748b', '#94a3b8'],
    bronze: ['#c2410c', '#ea580c', '#f97316'],
};

const BADGE_ICONS: Record<string, any> = {
    ai_excellence: Cpu,
    gold: Trophy,
    silver: Award,
    bronze: Medal,
};

export default function BadgeExportCard({ badge, studentName, onClose }: BadgeExportProps) {
    const [generating, setGenerating] = useState(false);

    const generateBadgeImage = async (): Promise<string> => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630; // LinkedIn/Twitter OG standard
        const ctx = canvas.getContext('2d')!;

        const colors = BADGE_GRADIENTS[badge.type] || BADGE_GRADIENTS.bronze;

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, colors[0]);
        bgGrad.addColorStop(0.5, colors[1]);
        bgGrad.addColorStop(1, colors[2]);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Overlay pattern (subtle dots)
        ctx.globalAlpha = 0.08;
        for (let x = 0; x < canvas.width; x += 30) {
            for (let y = 0; y < canvas.height; y += 30) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Dark overlay card
        const cardX = 60, cardY = 60, cardW = canvas.width - 120, cardH = canvas.height - 120;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 24);
        ctx.fill();

        // Inner border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cardX + 8, cardY + 8, cardW - 16, cardH - 16, 20);
        ctx.stroke();

        // Badge icon circle
        const iconX = canvas.width / 2;
        const iconY = 200;
        const iconR = 60;

        // Glow effect
        const glow = ctx.createRadialGradient(iconX, iconY, iconR * 0.5, iconX, iconY, iconR * 2);
        glow.addColorStop(0, colors[1] + '80');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(iconX - iconR * 2, iconY - iconR * 2, iconR * 4, iconR * 4);

        // Circle
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Badge icon text (unicode)
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        const iconMap: Record<string, string> = { ai_excellence: '🤖', gold: '🏆', silver: '🥈', bronze: '🥉' };
        ctx.fillText(iconMap[badge.type] || '🏅', iconX, iconY);

        // Badge label
        ctx.font = '900 42px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(badge.label.toUpperCase(), canvas.width / 2, 310);

        // Student name
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(`Earned by ${studentName}`, canvas.width / 2, 370);

        // Count badge
        ctx.font = '900 20px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`${badge.count}× Achievement${badge.count > 1 ? 's' : ''} Unlocked`, canvas.width / 2, 415);

        // Threshold
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`Mastery Threshold: ${badge.threshold}`, canvas.width / 2, 455);

        // SOEMS branding
        ctx.font = '900 14px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('SOEMS — Serverless Online Examination Management System', canvas.width / 2, 530);

        return canvas.toDataURL('image/png');
    };

    const handleDownload = async () => {
        setGenerating(true);
        try {
            const dataUrl = await generateBadgeImage();
            const link = document.createElement('a');
            link.download = `SOEMS_${badge.label.replace(/\s/g, '_')}_Badge.png`;
            link.href = dataUrl;
            link.click();
        } finally {
            setGenerating(false);
        }
    };

    const handleShare = async () => {
        setGenerating(true);
        try {
            const dataUrl = await generateBadgeImage();
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `SOEMS_${badge.label}_Badge.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `I earned the ${badge.label} badge on SOEMS! 🎉`,
                    text: `I achieved the ${badge.label} badge (${badge.threshold} mastery) in SOEMS — Serverless Online Examination Management System! #SOEMS #Achievement`,
                    files: [file],
                });
            } else {
                // Fallback: copy text to clipboard
                const text = `🏆 I earned the ${badge.label} badge on SOEMS!\n\n${badge.threshold} mastery achieved.\n\n#SOEMS #AcademicExcellence #Achievement`;
                await navigator.clipboard.writeText(text);
                alert('Share text copied to clipboard! You can paste it on any social media platform along with the downloaded badge image.');
                handleDownload(); // auto download for manual sharing
            }
        } finally {
            setGenerating(false);
        }
    };

    const Icon = BADGE_ICONS[badge.type] || Trophy;
    const colors = BADGE_GRADIENTS[badge.type] || BADGE_GRADIENTS.bronze;

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
                    initial={{ scale: 0.8, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 30 }}
                    className="bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-main)] max-w-md w-full overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Preview Card */}
                    <div
                        className="p-8 text-center relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})` }}
                    >
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        <div className="relative z-10">
                            <div className="h-20 w-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 ring-4 ring-white/20 shadow-xl">
                                <Icon className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-1">{badge.label}</h3>
                            <p className="text-white/70 text-sm font-bold">Earned by {studentName}</p>
                            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
                                <Sparkles className="h-3 w-3 text-white/80" />
                                <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">{badge.count}× Unlocked · {badge.threshold} Mastery</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 space-y-3">
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest text-center mb-4">Export Achievement</h4>
                        <Button
                            onClick={handleShare}
                            disabled={generating}
                            className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                        >
                            <Share2 className="h-4 w-4" />
                            {generating ? 'Generating...' : 'Share to Social Media'}
                        </Button>
                        <Button
                            onClick={handleDownload}
                            disabled={generating}
                            variant="outline"
                            className="w-full gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {generating ? 'Generating...' : 'Download as PNG'}
                        </Button>
                        <button onClick={onClose} className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold py-2 transition-colors">
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
