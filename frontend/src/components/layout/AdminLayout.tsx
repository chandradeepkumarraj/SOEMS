import { useMemo } from 'react';
import { Shield, Activity, Sparkles, Users, Settings } from 'lucide-react';
import DashboardLayout from './shared/DashboardLayout';
import { NavItem } from '../../types/layout';

export default function AdminLayout() {
    const navigation: NavItem[] = useMemo(() => [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Shield },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Live Monitor', href: '/admin/monitor', icon: Activity },
        { name: 'AI Configuration', href: '/admin/ai-settings', icon: Sparkles },
        { name: 'Profile & Settings', href: '/admin/profile', icon: Settings },
    ], []);

    return (
        <DashboardLayout
            roleName="Admin Panel"
            roleLabel="Super User"
            roleIcon={Shield}
            navigation={navigation}
            isStaff={true}
        />
    );
}
