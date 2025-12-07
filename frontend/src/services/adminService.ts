import axios from 'axios';
import { getCurrentUser } from './authService';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/admin`;

const getAuthHeader = () => {
    const user = getCurrentUser();
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

export const getUsers = async () => {
    const response = await axios.get(`${API_URL}/users`, { headers: getAuthHeader() });
    return response.data;
};

export const createUser = async (userData: any) => {
    const response = await axios.post(`${API_URL}/users`, userData, { headers: getAuthHeader() });
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await axios.delete(`${API_URL}/users/${id}`, { headers: getAuthHeader() });
    return response.data;
};

export const importUsersCode = async (formData: FormData) => {
    const response = await axios.post(`${API_URL}/users/import`, formData, {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const exportUsersUrl = () => {
    const user = getCurrentUser();
    return `${API_URL}/users/export?token=${user?.token}`;
};

export const getSystemStats = async () => {
    const response = await axios.get(`${API_URL}/system`, { headers: getAuthHeader() });
    return response.data;
};
