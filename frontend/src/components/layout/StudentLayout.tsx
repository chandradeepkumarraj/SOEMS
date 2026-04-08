import { useMemo } from 'react';
import { LayoutDashboard, FileText, BookOpen, User } from 'lucide-react';
import DashboardLayout from './shared/DashboardLayout';
import { NavItem } from '../../types/layout';

export default function StudentLayout() {
    const navigation: NavItem[] = useMemo(() => [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Exams', href: '/student/exams', icon: FileText },
        { name: 'My Results', href: '/student/results', icon: BookOpen },
        { name: 'Profile', href: '/profile', icon: User },
    ], []);

    return (
        <DashboardLayout
            roleName="Student Portal"
            roleLabel="Undergraduate"
            roleIcon={LayoutDashboard}
            navigation={navigation}
            isStaff={false}
        />
    );
}

