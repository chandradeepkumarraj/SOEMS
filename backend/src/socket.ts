import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
                const isDevelopment = process.env.NODE_ENV !== 'production';
                const isLocalRequest = origin && (
                    origin.includes('localhost') || 
                    origin.includes('127.0.0.1') || 
                    /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin)
                );

                if (!origin || allowedOrigins.includes(origin) || (isDevelopment && isLocalRequest)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('New client connected:', socket.id);

        // Join a specific room (e.g., an exam session or a user channel)
        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Leave a room
        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId);
            console.log(`Socket ${socket.id} left room ${roomId}`);
        });

        // Exam Events
        socket.on('exam-start', (data: { examId: string; studentId: string }) => {
            console.log(`Exam started by student ${data.studentId} for exam ${data.examId}`);
            // Notify teachers/admins monitoring this exam
            io.to(data.examId).emit('monitor-exam-start', data);
            io.to('global-proctor-room').emit('monitor-exam-start', data);
        });

        socket.on('exam-submit', (data: { examId: string; studentId: string }) => {
            console.log(`Exam submitted by student ${data.studentId} for exam ${data.examId}`);
            io.to(data.examId).emit('monitor-exam-submit', data);
            io.to('global-proctor-room').emit('monitor-exam-submit', data);
        });

        // Proctoring Events (e.g., tab switch, face not found)
        socket.on('proctor-alert', (data: { examId: string; studentId: string; studentName: string; studentRollNo?: string; type: string; message: string }) => {
            console.log(`[PROCTOR ALERT] ${data.type} from student ${data.studentName} (${data.studentRollNo || data.studentId}): ${data.message}`);
            // Fix: LiveMonitor.tsx expects `alertType`, but the incoming data uses `type`.
            const payload = { ...data, alertType: data.type };
            io.to(data.examId).emit('monitor-proctor-alert', payload);
            io.to('global-proctor-room').emit('monitor-proctor-alert', payload);

            // Global notification for staff bells
            io.to('global-proctor-room').emit('staff-notification', {
                type: 'alert',
                title: 'Security Alert',
                message: `${data.studentName} (${data.studentRollNo || 'N/A'}): ${data.type} - ${data.message}`,
                timestamp: new Date()
            });
        });

        socket.on('intercom-message', (data: { examId: string; studentId: string; message: string; sender: string }) => {
            console.log(`[INTERCOM] Proctor sent message to student ${data.studentId} in exam ${data.examId}: ${data.message}`);
            // Broadcast to the room. The frontend will filter if studentId matches the current user.
            io.to(data.examId).emit('intercom-message', data);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
