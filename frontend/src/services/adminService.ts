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
        headers: getAuthHeader()
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

const GROUP_API_URL = `${API_BASE_URL}/api/groups`;

export const getGroups = async () => {
    const response = await axios.get(GROUP_API_URL, { headers: getAuthHeader() });
    return response.data;
};

export const createGroup = async (groupData: any) => {
    const response = await axios.post(GROUP_API_URL, groupData, { headers: getAuthHeader() });
    return response.data;
};

export const getSubgroups = async (groupId?: string) => {
    const url = groupId ? `${GROUP_API_URL}/subgroups?groupId=${groupId}` : `${GROUP_API_URL}/subgroups`;
    const response = await axios.get(url, { headers: getAuthHeader() });
    return response.data;
};

export const createSubgroup = async (subgroupData: any) => {
    const response = await axios.post(`${GROUP_API_URL}/subgroups`, subgroupData, { headers: getAuthHeader() });
    return response.data;
};

export const resetUserPassword = async (userId: string, newPassword: string) => {
    const response = await axios.put(`${API_URL}/users/${userId}/reset-password`, { newPassword }, { headers: getAuthHeader() });
    return response.data;
};

export const deleteGroup = async (id: string) => {
    const response = await axios.delete(`${GROUP_API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
};

export const deleteSubgroup = async (id: string) => {
    const response = await axios.delete(`${GROUP_API_URL}/subgroups/${id}`, { headers: getAuthHeader() });
    return response.data;
};
