import apiClient from './apiClient';
import { getCurrentUser } from './authService';

const API_URL = '/api/admin';

export const getUsers = async () => {
    const response = await apiClient.get(`${API_URL}/users`);
    return response.data;
};

export const createUser = async (userData: any) => {
    const response = await apiClient.post(`${API_URL}/users`, userData);
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await apiClient.delete(`${API_URL}/users/${id}`);
    return response.data;
};

export const importUsersCode = async (formData: FormData) => {
    const response = await apiClient.post(`${API_URL}/users/import`, formData);
    return response.data;
};

export const exportUsersUrl = () => {
    const user = getCurrentUser();
    return `${API_URL}/users/export?token=${user?.token}`;
};

export const getSystemStats = async () => {
    const response = await apiClient.get(`${API_URL}/system`);
    return response.data;
};

const GROUP_API_URL = '/api/groups';

export const getGroups = async () => {
    const response = await apiClient.get(GROUP_API_URL);
    return response.data;
};

export const createGroup = async (groupData: any) => {
    const response = await apiClient.post(GROUP_API_URL, groupData);
    return response.data;
};

export const getSubgroups = async (groupId?: string) => {
    const url = groupId ? `${GROUP_API_URL}/subgroups?groupId=${groupId}` : `${GROUP_API_URL}/subgroups`;
    const response = await apiClient.get(url);
    return response.data;
};

export const createSubgroup = async (subgroupData: any) => {
    const response = await apiClient.post(`${GROUP_API_URL}/subgroups`, subgroupData);
    return response.data;
};

export const resetUserPassword = async (userId: string, newPassword: string) => {
    const response = await apiClient.put(`${API_URL}/users/${userId}/reset-password`, { newPassword });
    return response.data;
};

export const deleteGroup = async (id: string) => {
    const response = await apiClient.delete(`${GROUP_API_URL}/${id}`);
    return response.data;
};

export const deleteSubgroup = async (id: string) => {
    const response = await apiClient.delete(`${GROUP_API_URL}/subgroups/${id}`);
    return response.data;
};

export const getAIConfig = async () => {
    const response = await apiClient.get(`${API_URL}/config/ai`);
    return response.data;
};

export const updateAIConfig = async (configData: any) => {
    const response = await apiClient.put(`${API_URL}/config/ai`, configData);
    return response.data;
};

export const getSystemDefaults = async () => {
    const response = await apiClient.get(`${API_URL}/config/defaults`);
    return response.data;
};

export const updateSystemDefaults = async (defaultsData: any) => {
    const response = await apiClient.put(`${API_URL}/config/defaults`, defaultsData);
    return response.data;
};

