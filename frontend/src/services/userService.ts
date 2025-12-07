import axios from 'axios';
import { getCurrentUser } from './authService';

const API_URL = 'http://127.0.0.1:5001/api/users';

const getAuthHeader = () => {
    const user = getCurrentUser();
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

export const getUserProfile = async () => {
    const response = await axios.get(`${API_URL}/profile`, { headers: getAuthHeader() });
    return response.data;
};

export const updateUserProfile = async (userData: any) => {
    const response = await axios.put(`${API_URL}/profile`, userData, { headers: getAuthHeader() });

    // Update local storage user data (preserving token)
    const currentUser = getCurrentUser();
    if (currentUser) {
        const updated = { ...currentUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updated));
    }

    return response.data;
};

export const getMyStudents = async () => {
    const response = await axios.get(`${API_URL}/my-students`, { headers: getAuthHeader() });
    return response.data;
};
