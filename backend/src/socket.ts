import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Allow all for now, restrict in production
            methods: ['GET', 'POST']
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
        socket.on('proctor-alert', (data: { examId: string; studentId: string; alertType: string; message: string }) => {
            console.log(`[PROCTOR ALERT] ${data.alertType} from student ${data.studentId}: ${data.message}`);
            io.to(data.examId).emit('monitor-proctor-alert', data);
            io.to('global-proctor-room').emit('monitor-proctor-alert', data);
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
