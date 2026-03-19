export type BadgeType = 'bronze' | 'silver' | 'gold' | 'ai_excellence';

export interface Badge {
    type: BadgeType;
    label: string;
    description: string;
    icon: string;
    color: string;
    borderColor: string;
    bgColor: string;
}

export const calculateBadge = (score: number, totalPoints: number): Badge | null => {
    const percentage = (score / totalPoints) * 100;

    if (percentage === 100) {
        return {
            type: 'ai_excellence',
            label: 'AI Excellence',
            description: 'Achieved a perfect score in an intelligent examination.',
            icon: 'Cpu',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        };
    }
    if (percentage >= 95) {
        return {
            type: 'gold',
            label: 'Gold Medalist',
            description: 'Outstanding performance with near-perfect accuracy.',
            icon: 'Trophy',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200'
        };
    }
    if (percentage >= 80) {
        return {
            type: 'silver',
            label: 'Silver Scholar',
            description: 'Demonstrated high proficiency and deep understanding.',
            icon: 'Award',
            color: 'text-slate-600',
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-200'
        };
    }
    if (percentage >= 60) {
        return {
            type: 'bronze',
            label: 'Bronze Achiever',
            description: 'Successfully cleared the examination with solid marks.',
            icon: 'Medal',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        };
    }
    return null;
};

export const getBadgeTiers = () => [
    { type: 'ai_excellence', label: 'AI Excellence', threshold: '100%', color: 'bg-purple-500' },
    { type: 'gold', label: 'Gold', threshold: '>= 95%', color: 'bg-amber-500' },
    { type: 'silver', label: 'Silver', threshold: '>= 80%', color: 'bg-slate-500' },
    { type: 'bronze', label: 'Bronze', threshold: '>= 60%', color: 'bg-orange-500' },
];
