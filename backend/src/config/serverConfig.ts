import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const SERVER_CONFIG = {
    PORT: process.env.PORT || '', // Strictly from enviroment
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || '',
    MONGO_URI: process.env.MONGO_URI || '',
    FRONTEND_URL: process.env.FRONTEND_URL || '',
    AI_PROVIDER: process.env.AI_PROVIDER || 'ollama',
    OLLAMA_URL: process.env.OLLAMA_URL || '',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || '',
};

// Security Hardening: Validate critical configuration in production
if (process.env.NODE_ENV === 'production') {
    const criticalVars = ['JWT_SECRET', 'MONGO_URI'];
    criticalVars.forEach(v => {
        if (!process.env[v]) {
            console.error(`CRITICAL SECURITY ERROR: ${v} environment variable is missing.`);
            process.exit(1);
        }
    });
}
