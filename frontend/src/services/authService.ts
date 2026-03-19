import apiClient from './apiClient';




// Login User
export const login = async (userData: any) => {
    const response = await apiClient.post('/api/auth/login', userData);
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

// Logout User
export const logout = () => {
    localStorage.removeItem('user');
};

// Get Current User
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

// Fetch latest profile from server to sync local storage
export const getMe = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    
    try {
        const response = await apiClient.get('/api/auth/me');
        if (response.data) {
            // Update local storage but keep the token
            const updatedUser = { ...response.data, token: user.token };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        }
    } catch (error) {
        // If token is invalid or user deactivated
        logout();
        throw error;
    }
};

// Get Maintenance Status
export const getMaintenanceStatus = async () => {
    const response = await apiClient.get('/api/auth/maintenance-status');
    return response.data;
};
