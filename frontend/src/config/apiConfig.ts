/**
 * Centralized API & Server Configuration
 * Manage all backend endpoint fallbacks and port definitions here.
 */

// Derive the backend port from environment variables strictly
export const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT;

// The base URL for the backend API.
// In development, we return an empty string to force relative paths (/api/...) 
// so that the Vite Proxy handles the request, solving CORS issues.
export const getApiUrl = () => {
    if (import.meta.env.MODE === 'development') return '';
    return import.meta.env.VITE_API_URL || '';
};

// Base configuration for other services
export const API_CONFIG = {
    baseUrl: getApiUrl(),
    socketUrl: import.meta.env.MODE === 'development' ? '' : (import.meta.env.VITE_SOCKET_URL || ''),
};
