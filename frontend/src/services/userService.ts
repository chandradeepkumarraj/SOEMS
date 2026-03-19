import apiClient from './apiClient';
import { getCurrentUser } from './authService';

const API_URL = '/api/users';

export const getUserProfile = async () => {
    const response = await apiClient.get(`${API_URL}/profile`);
    return response.data;
};

export const updateUserProfile = async (userData: any) => {
    const response = await apiClient.put(`${API_URL}/profile`, userData);

    // Update local storage user data (preserving token)
    const currentUser = getCurrentUser();
    if (currentUser) {
        const updated = { ...currentUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updated));
    }

    return response.data;
};

export const getMyStudents = async () => {
    const response = await apiClient.get(`${API_URL}/my-students`);
    return response.data;
};

export const getProctors = async () => {
    const response = await apiClient.get(`${API_URL}/proctors`);
    return response.data;
};
