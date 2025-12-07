import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/questions`;

const getAuthHeader = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

export const createQuestion = async (questionData: any) => {
    const response = await axios.post(API_URL, questionData, { headers: getAuthHeader() });
    return response.data;
};

export const getQuestions = async () => {
    const response = await axios.get(API_URL, { headers: getAuthHeader() });
    return response.data;
};
