import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Cpu, Info, Share2 } from 'lucide-react';
import { getMyResults } from '../../services/resultService';
import { calculateBadge, getBadgeTiers } from '../../utils/badgeUtils';
import { getCurrentUser } from '../../services/authService';
import BadgeExportCard from './BadgeExportCard';

export default function TrophyRoom() {
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState<any>(null);

    const user = getCurrentUser();

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const results = await getMyResults();
                const earnedBadges = (results || [])
                    .map((r: any) => calculateBadge(r.score, r.totalPoints))
                    .filter(Boolean);

                const counts = earnedBadges.reduce((acc: any, b: any) => {
                    acc[b.type] = (acc[b.type] || 0) + 1;
                    return acc;
                }, {});

                const badgeData = getBadgeTiers().map(tier => ({
                    ...tier,
                    count: counts[tier.type] || 0
                }));

                setBadges(badgeData);
            } catch (error) {
                console.error('Failed to fetch badges:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBadges();
    }, []);

    if (loading) return <div className="h-48 bg-gray-50 dark:bg-slate-800/50 animate-pulse rounded-xl" />;

    return (
        <>
            <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" /> Professional Achievement Trophy Room
                    </h2>
                    <div className="group relative">
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl border border-white/10">
                            Click any earned badge to export it as a premium social media card!
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {badges.map((badge) => (
                        <motion.div
                            key={badge.type}
                            whileHover={{ scale: badge.count > 0 ? 1.05 : 1 }}
                            whileTap={{ scale: badge.count > 0 ? 0.97 : 1 }}
                            onClick={() => badge.count > 0 && setSelectedBadge(badge)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center relative transition-all duration-300 ${badge.count > 0
                                    ? 'border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 dark:border-amber-900/30 shadow-sm cursor-pointer group'
                                    : 'border-dashed border-gray-100 dark:border-slate-800 opacity-40 grayscale'
                                }`}
                        >
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 ${badge.color} text-white shadow-lg`}>
                                {badge.type === 'ai_excellence' && <Cpu className="h-6 w-6" />}
                                {badge.type === 'gold' && <Trophy className="h-6 w-6" />}
                                {badge.type === 'silver' && <Award className="h-6 w-6" />}
                                {badge.type === 'bronze' && <Medal className="h-6 w-6" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-slate-100 text-center">{badge.label}</span>
                            {badge.count > 0 && (
                                <>
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                                        {badge.count}
                                    </div>
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-white text-[7px] font-black px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                        <Share2 className="h-2 w-2" /> SHARE
                                    </div>
                                </>
                            )}
                            <span className="text-[9px] text-gray-500 dark:text-slate-500 mt-1 font-bold">{badge.threshold} Mastery</span>
                        </motion.div>
                    ))}
                </div>

                {badges.some(b => b.count > 0) && (
                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 mt-4 font-bold">
                        Click any earned badge to export as a premium social media card
                    </p>
                )}
            </div>

            {selectedBadge && (
                <BadgeExportCard
                    badge={selectedBadge}
                    studentName={user?.name || 'Student'}
                    onClose={() => setSelectedBadge(null)}
                />
            )}
        </>
    );
}
