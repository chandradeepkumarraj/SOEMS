console.log('Starting SOEMS Backend...');
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { seedAdmin, adminRoutes } from './modules/system/systemModule';
import { authRoutes } from './modules/auth/authModule';
import { userRoutes, groupRoutes } from './modules/user/userModule';
import { questionRoutes } from './modules/question/questionModule';
import { examRoutes } from './modules/exam/examModule';
import { resultRoutes } from './modules/analytics/analyticsModule';
import { notificationRoutes, initSocket, startAutoCompleteScheduler } from './modules/communication/communicationModule';
import http from 'http';
import fs from 'fs';
import { startAIWorker } from './modules/ai/aiWorker';
import { uploadRoutes } from './modules/upload/uploadModule';
import path from 'path';
import { aiRoutes } from './modules/ai/aiModule';
import rateLimit from 'express-rate-limit';
import { SERVER_CONFIG } from './config/serverConfig';
import { checkMaintenance } from './middleware/maintenanceMiddleware';

dotenv.config();

// Check environment variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
requiredEnv.forEach(env => {
    if (!SERVER_CONFIG[env as keyof typeof SERVER_CONFIG]) {
        console.error(`FATAL ERROR: Environment variable ${env} is not defined in current configuration.`);
        process.exit(1);
    }
});

// Global Error Handlers for Stability
process.on('unhandledRejection', (reason, promise) => {
    const msg = `[${new Date().toISOString()}] Unhandled Rejection at: ${promise} reason: ${reason}\n`;
    console.error(msg);
    fs.appendFileSync('crash_log.txt', msg);
});

process.on('uncaughtException', (error) => {
    const msg = `[${new Date().toISOString()}] Uncaught Exception: ${error.message}\n${error.stack}\n`;
    console.error(msg);
    fs.appendFileSync('crash_log.txt', msg);
    process.exit(1);
});


const app = express();
const PORT = SERVER_CONFIG.PORT;

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50000, // Increased for high-concurrency exam scenarios (shared IPs in labs)
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // Increased to allow classroom-sized logins from a single IP
    message: 'Too many login attempts from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...(helmet.contentSecurityPolicy ? (helmet.contentSecurityPolicy as any).getDefaultDirectives() : {}),
            "style-src": ["'self'", "'unsafe-inline'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            "img-src": ["'self'", "data:", "https:"],
        },
    },
}));

// Apply global NoSQL Injection sanitizer
app.use(mongoSanitize());


// Dynamic CORS configuration
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = SERVER_CONFIG.FRONTEND_URL ? SERVER_CONFIG.FRONTEND_URL.split(',') : [];
        
        // In development, allow localhost, 127.0.0.1, and private IP ranges (local network)
        const isDevelopment = SERVER_CONFIG.NODE_ENV !== 'production';
        const isLocalRequest = origin && (
            origin.includes('localhost') || 
            origin.includes('127.0.0.1') || 
            /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin)
        );

        if (!origin || allowedOrigins.includes(origin) || (isDevelopment && isLocalRequest)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

if (SERVER_CONFIG.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Trust first proxy (e.g. Nginx, Heroku, AWS ELB)
}

if (SERVER_CONFIG.NODE_ENV === 'production' && !SERVER_CONFIG.FRONTEND_URL) {
    console.warn('CRITICAL SECURITY WARNING: FRONTEND_URL is not defined in production. CORS is currently open to all origins (*).');
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(checkMaintenance);
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/questions/generate', authLimiter); // Protect expensive AI generation

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        node_env: SERVER_CONFIG.NODE_ENV,
        uptime: process.uptime()
    });
});

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('SOEMS Backend is running!');
});

import { globalErrorHandler } from './middleware/errorMiddleware';

// ... (other imports)

// Error handling middleware
app.use(globalErrorHandler);

const server = http.createServer(app);
const io = initSocket(server);

// Start Server Sequence
const startServer = async () => {
    try {
        console.log('Connecting to Database...');
        await connectDB();
        seedAdmin();

        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`FATAL ERROR: Port ${PORT} is already in use.`);
            } else {
                console.error('SERVER ERROR:', error);
            }
            process.exit(1);
        });

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            startAutoCompleteScheduler();
            startAIWorker();
            
            try {
                fs.writeFileSync('server_status.txt', `Server started on port ${PORT} at ${new Date().toISOString()}`);
            } catch (e) {
                console.error('Failed to write status file', e);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
