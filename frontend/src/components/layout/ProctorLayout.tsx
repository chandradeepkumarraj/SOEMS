import { useMemo } from 'react';
import { Activity, Settings, Shield } from 'lucide-react';
import DashboardLayout from './shared/DashboardLayout';
import { NavItem } from '../../types/layout';

export default function ProctorLayout() {
    const navigation: NavItem[] = useMemo(() => [
        { name: 'Dashboard', href: '/proctor/dashboard', icon: Shield },
        { name: 'Profile', href: '/proctor/profile', icon: Settings },
    ], []);

    return (
        <DashboardLayout
            roleName="Proctor Portal"
            roleLabel="Official Proctor"
            roleIcon={Activity}
            navigation={navigation}
            isStaff={true}
        />
    );
}

