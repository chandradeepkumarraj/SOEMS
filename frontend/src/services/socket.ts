import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket: Socket | null = null;

export const initSocketConnection = (): Socket => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
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

export const emitProctorAlert = (examId: string, studentId: string, studentName: string, studentRollNo: string, type: string, message: string, snapshot?: string, transcript?: string) => {
    const s = getSocket();
    s.emit('proctor-alert', { examId, studentId, studentName, studentRollNo, type, message, snapshot, transcript });
};
export const onExamClosedManually = (callback: (data: any) => void) => {
    const s = getSocket();
    s.on('exam-closed-manually', callback);
    return () => { s.off('exam-closed-manually', callback); };
};

export const onStudentSuspended = (callback: (data: any) => void) => {
    const s = getSocket();
    s.on('student-suspended', callback);
    return () => { s.off('student-suspended', callback); };
};

export const onStudentUnsuspended = (callback: (data: any) => void) => {
    const s = getSocket();
    s.on('student-unsuspended', callback);
    return () => { s.off('student-unsuspended', callback); };
};
export const onNotificationReceived = (callback: (data: any) => void) => {
    const s = getSocket();
    s.on('new-notification', callback);
    return () => { s.off('new-notification', callback); };
};

export const onStaffNotificationReceived = (callback: (data: any) => void) => {
    const s = getSocket();
    s.emit('join-room', 'global-proctor-room'); // Staff must be in this room
    s.on('staff-notification', callback);
    return () => { s.off('staff-notification', callback); };
};

export const emitIntercomMessage = (examId: string, studentId: string, message: string, sender: string = 'Proctor') => {
    const s = getSocket();
    s.emit('intercom-message', { examId, studentId, message, sender });
};

export const onIntercomMessage = (callback: (data: { examId: string; studentId: string; message: string; sender: string }) => void) => {
    const s = getSocket();
    s.on('intercom-message', callback);
    return () => { s.off('intercom-message', callback); };
};
