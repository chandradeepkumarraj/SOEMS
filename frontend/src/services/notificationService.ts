import apiClient from './apiClient';

const API_URL = '/api/notifications';

export const getMyNotifications = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

export const markAsRead = async (id: string) => {
    const response = await apiClient.put(`${API_URL}/${id}/read`, {});
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await apiClient.put(`${API_URL}/read-all`, {});
    return response.data;
};

export const clearNotifications = async () => {
    const response = await apiClient.delete(`${API_URL}/clear`);
    return response.data;
};
