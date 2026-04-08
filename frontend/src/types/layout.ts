import { LucideIcon } from 'lucide-react';

export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    children?: NavItem[];
}

export interface Notification {
    id?: string;
    _id?: string;
    type: string;
    title: string;
    message: string;
    timestamp?: Date;
    createdAt?: Date;
    read?: boolean;
    isRead?: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'student' | 'proctor';
    avatarUrl?: string;
    rollNo?: string;
}
