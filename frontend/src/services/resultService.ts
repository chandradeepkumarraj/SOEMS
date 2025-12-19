import axios from 'axios';
import { getCurrentUser } from './authService';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/results`;

const getAuthHeader = () => {
    const user = getCurrentUser();
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

export const getMyResults = async () => {
    const response = await axios.get(`${API_URL}/my-results`, { headers: getAuthHeader() });
    return response.data;
};

export const getResultById = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
};

export const getResultsByExam = async (examId: string) => {
    const response = await axios.get(`${API_URL}/exam/${examId}`, { headers: getAuthHeader() });
    return response.data;
};

export const getResultAnalysis = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}/analysis`, { headers: getAuthHeader() });
    return response.data;
};
