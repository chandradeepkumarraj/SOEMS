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

export const logViolation = async (id: string, violationData: { type: string, message: string }) => {
    const response = await axios.post(`${API_URL}/${id}/violation`, violationData, { headers: getAuthHeader() });
    return response.data;
};

export const getExamViolations = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}/violations`, { headers: getAuthHeader() });
    return response.data;
};

export const getGlobalProctorStats = async () => {
    const response = await axios.get(`${API_URL}/proctor/global-stats`, { headers: getAuthHeader() });
    return response.data;
};

export const getActiveSessions = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}/active-sessions`, { headers: getAuthHeader() });
    return response.data;
};

export const getCheatingAnalysis = async () => {
    const response = await axios.get(`${API_URL}/proctor/cheating-analysis`, { headers: getAuthHeader() });
    return response.data;
};

export const downloadCheatingReport = async (id: string, examTitle: string) => {
    const response = await axios.get(`${API_URL}/${id}/cheating-report`, {
        headers: getAuthHeader(),
        responseType: 'blob'
    });

    // Create a link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cheating_Report_${examTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const resumeStudentSession = async (examId: string, studentId: string) => {
    const response = await axios.post(`${API_URL}/${examId}/resume/${studentId}`, {}, { headers: getAuthHeader() });
    return response.data;
};
