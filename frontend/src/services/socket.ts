import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket: Socket | null = null;

export const initSocketConnection = (): Socket => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('Connected to socket server:', socket?.id);
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason);
    });

    return socket;
};

export const getSocket = (): Socket => {
    if (!socket) {
        return initSocketConnection();
    }
    return socket;
};

export const joinExamRoom = (examId: string) => {
    const s = getSocket();
    if (s.connected) {
        s.emit('join-room', examId);
    } else {
        // Retry or wait for connection
        s.once('connect', () => {
            s.emit('join-room', examId);
        });
    }
};

export const leaveExamRoom = (examId: string) => {
    const s = getSocket();
    if (s.connected) s.emit('leave-room', examId);
};

export const emitExamStart = (examId: string, studentId: string) => {
    const s = getSocket();
    s.emit('exam-start', { examId, studentId });
};

export const emitExamSubmit = (examId: string, studentId: string) => {
    const s = getSocket();
    s.emit('exam-submit', { examId, studentId });
};

export const emitProctorAlert = (examId: string, studentId: string, alertType: string, message: string) => {
    const s = getSocket();
    s.emit('proctor-alert', { examId, studentId, alertType, message });
};
