console.log('Starting SOEMS Backend...');
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import seedAdmin from './utils/seeder';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import questionRoutes from './routes/questionRoutes';
import examRoutes from './routes/examRoutes';
import resultRoutes from './routes/resultRoutes';
import adminRoutes from './routes/adminRoutes';
import groupRoutes from './routes/groupRoutes';
import http from 'http';
import { initSocket } from './socket';
import fs from 'fs';
import { startExamExpirationWorker } from './utils/examWorker';

dotenv.config();

connectDB().then(() => {
    seedAdmin();
});

// Check environment variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
requiredEnv.forEach(env => {
    if (!process.env[env]) {
        console.error(`FATAL ERROR: Environment variable ${env} is not defined.`);
        process.exit(1);
    }
});

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('SOEMS Backend is running!');
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const server = http.createServer(app);
const io = initSocket(server);

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Start background workers
    startExamExpirationWorker();

    try {
        fs.writeFileSync('server_status.txt', `Server started on port ${PORT} at ${new Date().toISOString()}`);
    } catch (e) {
        console.error('Failed to write status file', e);
    }
});
