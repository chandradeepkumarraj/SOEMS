import apiClient from './apiClient';

const API_URL = '/api/results';

export const getMyResults = async () => {
    const response = await apiClient.get(`${API_URL}/my-results`);
    return response.data;
};

export const getResultById = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
};

export const getMyResultForExam = async (examId: string) => {
    const response = await apiClient.get(`${API_URL}/exam/${examId}/my-result`);
    return response.data;
};

export const getResultsByExam = async (examId: string) => {
    const response = await apiClient.get(`${API_URL}/exam/${examId}`);
    return response.data;
};

export const getResultAnalysis = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/analysis`);
    return response.data;
};

export const getMyImprovementReport = async () => {
    const response = await apiClient.get(`${API_URL}/my-improvement`);
    return response.data;
};
