import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/exams`;

const getAuthHeader = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

export const createExam = async (examData: any) => {
    const response = await axios.post(API_URL, examData, { headers: getAuthHeader() });
    return response.data;
};

export const updateExam = async (id: string, examData: any) => {
    const response = await axios.put(`${API_URL}/${id}`, examData, { headers: getAuthHeader() });
    return response.data;
};

export const getExams = async () => {
    const response = await axios.get(API_URL, { headers: getAuthHeader() });
    return response.data;
};

export const getExamById = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
};

export const deleteExam = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
};

export const submitExam = async (id: string, answers: any[]) => {
    const response = await axios.post(`${API_URL}/${id}/submit`, { answers }, { headers: getAuthHeader() });
    return response.data;
};

export const getExamStats = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}/stats`, { headers: getAuthHeader() });
    return response.data;
};

export const getTeacherDashboardStats = async () => {
    const response = await axios.get(`${API_URL}/teacher-stats`, { headers: getAuthHeader() });
    return response.data;
};

export const startExamSession = async (id: string) => {
    const response = await axios.post(`${API_URL}/start/${id}`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const updateExamProgress = async (id: string, answers: any, timeSpent: any, flagged: any) => {
    const response = await axios.post(`${API_URL}/progress/${id}`, { answers, timeSpent, flagged }, { headers: getAuthHeader() });
    return response.data;
};
export const endExam = async (id: string) => {
    const response = await axios.post(`${API_URL}/${id}/end`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const getExamAnalytics = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}/analytics`, { headers: getAuthHeader() });
    return response.data;
};
