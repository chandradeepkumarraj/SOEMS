import apiClient from './apiClient';

const API_URL = '/api/exams';

export const createExam = async (examData: any) => {
    const response = await apiClient.post(API_URL, examData);
    return response.data;
};

export const updateExam = async (id: string, examData: any) => {
    const response = await apiClient.put(`${API_URL}/${id}`, examData);
    return response.data;
};

export const getExams = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

export const getExamById = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
};

export const deleteExam = async (id: string) => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
};

export const submitExam = async (id: string, answers: any[]) => {
    const response = await apiClient.post(`${API_URL}/${id}/submit`, { answers });
    return response.data;
};

export const getExamStats = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/stats`);
    return response.data;
};

export const getTeacherDashboardStats = async () => {
    const response = await apiClient.get(`${API_URL}/teacher-stats`);
    return response.data;
};

export const startExamSession = async (id: string) => {
    const response = await apiClient.post(`${API_URL}/start/${id}`, {});
    return response.data;
};

export const updateExamProgress = async (id: string, answers: any, timeSpent: any, flagged: any, idCardFront?: string, idCardBack?: string) => {
    const response = await apiClient.post(`${API_URL}/progress/${id}`, { answers, timeSpent, flagged, idCardFront, idCardBack });
    return response.data;
};

export const endExam = async (id: string) => {
    const response = await apiClient.post(`${API_URL}/${id}/end`, {});
    return response.data;
};

export const getExamAnalytics = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/analytics`);
    return response.data;
};

export const logViolation = async (examId: string, violation: { type: string, message: string, snapshot?: string, transcript?: string }) => {
    try {
        const response = await apiClient.post(`${API_URL}/${examId}/violation`, violation);
        return response.data;
    } catch (error: any) {
        // If session is already suspended or finished, backend returns 403 or 404
        // We return the error data if available, or a default object to prevent downstream crashes
        console.warn('Violation logging rejected by server:', error.response?.data?.message || error.message);
        return error.response?.data || { isSuspended: false, violationCount: 0 };
    }
};

export const getExamViolations = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/violations`);
    return response.data;
};

export const getGlobalProctorStats = async () => {
    const response = await apiClient.get(`${API_URL}/proctor/global-stats`);
    return response.data;
};

export const getActiveSessions = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/active-sessions`);
    return response.data;
};

export const getCheatingAnalysis = async () => {
    const response = await apiClient.get(`${API_URL}/proctor/cheating-analysis`);
    return response.data;
};

export const downloadCheatingReport = async (id: string, examTitle: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/cheating-report`, {
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
    const response = await apiClient.post(`${API_URL}/${examId}/resume/${studentId}`, {});
    return response.data;
};

export const resetExam = async (id: string, regenerateQuestions: boolean = false) => {
    const response = await apiClient.post(`${API_URL}/${id}/reset`, { regenerateQuestions });
    return response.data;
};

// === Adaptive C.A.T. API ===
export const getNextAdaptiveQuestion = async (examId: string) => {
    const response = await apiClient.get(`${API_URL}/${examId}/adaptive/next`);
    return response.data;
};

export const submitAdaptiveAnswer = async (examId: string, questionId: string, selectedOption: number | null, textAnswer?: string) => {
    const response = await apiClient.post(`${API_URL}/${examId}/adaptive/answer`, { questionId, selectedOption, textAnswer });
    return response.data;
};

export const exportExamResults = async (id: string, examTitle: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/export`, {
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Exam_Results_${examTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const getAIClassInsight = async (id: string) => {
    const response = await apiClient.get(`${API_URL}/${id}/ai-insight`);
    return response.data;
};

export const getStudentViolations = async (examId: string, studentId: string) => {
    const response = await apiClient.get(`${API_URL}/${examId}/violations/${studentId}`);
    return response.data;
};
