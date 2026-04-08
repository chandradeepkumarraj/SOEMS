import axios from 'axios';
import { API_BASE_URL } from '../config';

// Centralized API client instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Inject Authorization header if token exists and it's an internal request
apiClient.interceptors.request.use(
    (config) => {
        // Only add token to internal requests (relative URLs) to prevent leakage
        const isExternal = config.url && (config.url.startsWith('http://') || config.url.startsWith('https://'));
        
        if (!isExternal) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            }
        }

        // Fix for File Uploads: Let browser automatically set boundary for multipart forms
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Global error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 503 Service Unavailable (Maintenance Mode)
        if (error.response && error.response.status === 503 && error.response.data?.maintenance) {
            // Redirect to maintenance page if not already there
            if (window.location.pathname !== '/maintenance') {
                window.location.href = '/maintenance';
            }
        }

        // Handle 429 Too Many Requests (Rate Limiting)
        if (error.response && error.response.status === 429) {
            // Use browser alert or console as fallback if no toast library is present
            console.error('Rate limit reached. Please wait before trying again.');
            // alert('System is receiving too many requests. Please wait a moment.');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
