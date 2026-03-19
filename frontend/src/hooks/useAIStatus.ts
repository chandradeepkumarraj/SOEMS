import { useState, useEffect } from 'react';
import { getAIStatus } from '../services/aiService';
import { AI_PROVIDERS, DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER } from '../config/aiConfig';

export interface AIStatus {
    provider: string;
    model: string;
    aiEnabled: boolean;
    loading: boolean;
    error: string | null;
}

export const useAIStatus = () => {
    const [status, setStatus] = useState<AIStatus>({
        provider: DEFAULT_AI_PROVIDER,
        model: DEFAULT_AI_MODEL,
        aiEnabled: true,
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getAIStatus();
                setStatus({
                    provider: data.provider || DEFAULT_AI_PROVIDER,
                    model: data.model || DEFAULT_AI_MODEL,
                    aiEnabled: data.aiEnabled ?? true,
                    loading: false,
                    error: null
                });
            } catch (err: any) {
                console.error('Failed to fetch AI status:', err);
                setStatus(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to sync with AI engine'
                }));
            }
        };

        fetchStatus();
    }, []);

    const getModelDisplayName = () => {
        if (status.loading) return 'Syncing...';

        const providerConfig = AI_PROVIDERS.find(p => p.id === status.provider);
        const providerName = providerConfig ? providerConfig.name : status.provider;

        return `${providerName} (${status.model})`;
    };

    return { ...status, getModelDisplayName };
};
