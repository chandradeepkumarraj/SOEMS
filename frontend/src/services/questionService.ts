import apiClient from './apiClient';

const API_URL = '/api/questions';

export const createQuestion = async (questionData: any) => {
    const response = await apiClient.post(API_URL, questionData);
    return response.data;
};

export const updateQuestion = async (id: string, questionData: any) => {
    const response = await apiClient.put(`${API_URL}/${id}`, questionData);
    return response.data;
};

export const getQuestions = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

export const generateQuestionsWithAI = async (data: {
    subject: string;
    topic: string;
    count: number;
    difficulty: string;
    type: string;
}) => {
    const response = await apiClient.post(`${API_URL}/generate-ai`, data);
    return response.data;
};
