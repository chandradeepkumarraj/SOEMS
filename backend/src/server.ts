console.log('Starting SOEMS Backend...');
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import questionRoutes from './routes/questionRoutes';
import examRoutes from './routes/examRoutes';
import resultRoutes from './routes/resultRoutes';

dotenv.config();

connectDB();

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

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('SOEMS Backend is running!');
});

import http from 'http';
import { initSocket } from './socket';
import fs from 'fs';

const server = http.createServer(app);
const io = initSocket(server);

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    try {
        fs.writeFileSync('server_status.txt', `Server started on port ${PORT} at ${new Date().toISOString()}`);
    } catch (e) {
        console.error('Failed to write status file', e);
    }
});
