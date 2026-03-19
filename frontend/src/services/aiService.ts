import apiClient from './apiClient';

export const getAIStatus = async () => {
    try {
        const response = await apiClient.get('/api/ai/status');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch AI status:', error);
        return { aiEnabled: false, provider: 'none', model: 'none' };
    }
};
