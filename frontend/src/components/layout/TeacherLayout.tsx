import { useMemo } from 'react';
import { BarChart3, FileText, Users, GraduationCap, User } from 'lucide-react';
import DashboardLayout from './shared/DashboardLayout';
import { NavItem } from '../../types/layout';

export default function TeacherLayout() {
    const navigation: NavItem[] = useMemo(() => [
        { name: 'Dashboard', href: '/teacher/dashboard', icon: BarChart3 },
        { name: 'My Exams', href: '/teacher/exams', icon: FileText },
        { name: 'Students', href: '/teacher/students', icon: Users },
        { name: 'Profile', href: '/teacher/profile', icon: User },
    ], []);

    return (
        <DashboardLayout
            roleName="Teacher Portal"
            roleLabel="Academic Staff"
            roleIcon={GraduationCap}
            navigation={navigation}
            isStaff={true}
        />
    );
}
