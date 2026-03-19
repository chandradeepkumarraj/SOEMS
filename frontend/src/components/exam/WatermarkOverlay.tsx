import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService';

export default function WatermarkOverlay() {
    const [positions, setPositions] = useState<{ id: number, top: number, left: number }[]>([]);
    const [userIdentifier, setUserIdentifier] = useState('STUDENT');

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setUserIdentifier(`${user.email} | ${user.rollNo || user._id}`);
        }

        // Generate 15 floating watermarks
        const initialPositions = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            top: Math.random() * 90,
            left: Math.random() * 90
        }));
        setPositions(initialPositions);

        // Slowly randomize their positions every 5 seconds for dynamic effect
        const interval = setInterval(() => {
            setPositions(prev => prev.map(p => ({
                ...p,
                top: Math.random() * 90,
                left: Math.random() * 90
            })));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none">
            {positions.map((pos) => (
                <div
                    key={pos.id}
                    className="absolute text-black dark:text-white font-mono font-black text-sm sm:text-lg whitespace-nowrap transition-all duration-[5000ms] ease-linear"
                    style={{
                        top: `${pos.top}%`,
                        left: `${pos.left}%`,
                        opacity: 0.08,
                        transform: 'rotate(-30deg)'
                    }}
                >
                    {userIdentifier}
                </div>
            ))}
        </div>
    );
}
