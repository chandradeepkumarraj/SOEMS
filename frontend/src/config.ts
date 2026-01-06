// In Docker/Production, we want relative paths (empty string) so Nginx proxies it.
// In Local Dev, we fallback to localhost:5002
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5002';

// Socket URL should be the origin (empty string) in production to use the same host
export const SOCKET_URL = API_BASE_URL && API_BASE_URL.includes('/api')
    ? API_BASE_URL.replace('/api', '')
    : (API_BASE_URL || 'http://localhost:5002');
