import { updateExamProgress } from './examService';

const OFFLINE_KEY_PREFIX = 'soems_offline_progress_';

/**
 * Saves exam progress to local storage as a fail-safe buffer.
 */
export const saveProgressOffline = (examId: string, answers: any, timeSpent: any, flagged: any) => {
    try {
        const data = {
            answers,
            timeSpent,
            flagged,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`${OFFLINE_KEY_PREFIX}${examId}`, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save progress to localStorage:', error);
    }
};

/**
 * Retrieves cached local progress for a specific exam.
 */
export const getOfflineProgress = (examId: string) => {
    try {
        const data = localStorage.getItem(`${OFFLINE_KEY_PREFIX}${examId}`);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to read progress from localStorage:', error);
        return null;
    }
};

/**
 * Removes local progress cache for an exam.
 */
export const clearOfflineProgress = (examId: string) => {
    localStorage.removeItem(`${OFFLINE_KEY_PREFIX}${examId}`);
};

/**
 * Attempts to push any pending local progress to the server.
 */
export const syncOfflineProgress = async (examId: string) => {
    if (!window.navigator.onLine) {
        console.warn('Sync aborted: Browser is offline.');
        return;
    }

    const data = getOfflineProgress(examId);
    if (!data) return;

    try {
        await updateExamProgress(examId, data.answers, data.timeSpent, data.flagged);
        // We don't necessarily clear it here, as it acts as a permanent secondary backup
        // but we can mark it as synced if we had a "needsSync" flag.
        // For now, simple overwrite on next change is fine.
        console.log(`Offline progress synced for exam ${examId}`);
    } catch (error: any) {
        if (error.response?.status === 404) {
            console.warn(`Sync failed: Exam session ${examId} not found or expired. Clearing local cache.`);
            clearOfflineProgress(examId);
        } else {
            console.error(`Failed to sync offline progress for exam ${examId}:`, error);
        }
        throw error;
    }
};
