import React, { createContext, useContext, useState, useRef, MutableRefObject } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

interface ExamContextState {
    examId: string | null;
    examTitle: string;
    timeLeft: number;
    syncStatus: SyncStatus;
    socketConnected: boolean;
    violationCount: number;
    isAdaptive: boolean;
    isPausedRef: MutableRefObject<boolean>;
    submittingRef: MutableRefObject<boolean>;
    t: TFunction;
    formatTime: (seconds: number) => string;
    
    // Setters
    setExamId: (id: string | null) => void;
    setExamTitle: (title: string) => void;
    setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
    setSyncStatus: (status: SyncStatus) => void;
    setSocketConnected: (connected: boolean) => void;
    setViolationCount: React.Dispatch<React.SetStateAction<number>>;
    setIsAdaptive: (adaptive: boolean) => void;
}

const ExamContext = createContext<ExamContextState | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const [examId, setExamId] = useState<string | null>(null);
    const [examTitle, setExamTitle] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [socketConnected, setSocketConnected] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [isAdaptive, setIsAdaptive] = useState(false);
    
    const isPausedRef = useRef(false);
    const submittingRef = useRef(false);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const value = {
        examId,
        examTitle,
        timeLeft,
        syncStatus,
        socketConnected,
        violationCount,
        isAdaptive,
        isPausedRef,
        submittingRef,
        t,
        formatTime,

        setExamId,
        setExamTitle,
        setTimeLeft,
        setSyncStatus,
        setSocketConnected,
        setViolationCount,
        setIsAdaptive
    };

    return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

export const useExamContext = () => {
    const context = useContext(ExamContext);
    if (context === undefined) {
        throw new Error('useExamContext must be used within an ExamProvider');
    }
    return context;
};
