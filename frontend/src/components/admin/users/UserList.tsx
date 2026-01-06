import { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Key, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { getUsers, deleteUser, createUser, resetUserPassword, getGroups, getSubgroups } from '../../../services/adminService';

interface UserListProps {
    refreshTrigger: number;
}

export default function UserList({ refreshTrigger }: UserListProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [subgroups, setSubgroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<'all' | 'student' | 'teacher' | 'admin' | 'proctor'>('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // New User Form State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        rollNo: '',
        phoneNumber: '',
        groupId: '',
        subgroupId: ''
    });

    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, [refreshTrigger]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [usersData, groupsData] = await Promise.all([getUsers(), getGroups()]);
            setUsers(Array.isArray(usersData) ? usersData : []);
            setGroups(groupsData);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubgroupsForGroup = async (groupId: string) => {
        try {
            const data = await getSubgroups(groupId);
            setSubgroups(data);
        } catch (error) {
            console.error('Failed to fetch subgroups', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(id);
                setUsers(users.filter(u => u._id !== id));
                setMsg({ type: 'success', text: 'User deleted' });
            } catch (error) {
                setMsg({ type: 'error', text: 'Failed to delete user' });
            }
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await createUser(newUser);
            setUsers([created, ...users]);
            setShowAddModal(false);
            setNewUser({
                name: '', email: '', password: '', role: 'student', rollNo: '', phoneNumber: '', groupId: '', subgroupId: ''
            });
            setMsg({ type: 'success', text: `User ${created.name} created!` });
        } catch (error: any) {
            setMsg({ type: 'error', text: error.response?.data?.message || 'Failed to create user' });
        }
    };

    const handleResetPassword = async (userId: string, userName: string) => {
        const newPassword = prompt(`Enter new password for ${userName}:`);
        if (newPassword && newPassword.length >= 6) {
            try {
                await resetUserPassword(userId, newPassword);
                setMsg({ type: 'success', text: `Password reset for ${userName}` });
            } catch (error) {
                setMsg({ type: 'error', text: 'Failed to reset password' });
            }
        }
    };

    const filteredUsers = users.filter((u: any) => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.rollNo && u.rollNo.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = selectedRole === 'all' || u.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as any)}
                        className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="teacher">Teachers</option>
                        <option value="admin">Admins</option>
                        <option value="proctor">Proctors</option>
                    </select>
                    <Button variant="outline" onClick={() => setShowAddModal(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            {msg && (
                <div className={`p-4 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {msg.text}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left sticky-header">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-sm sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 font-medium bg-gray-50 dark:bg-slate-800">Name</th>
                                <th className="px-6 py-4 font-medium bg-gray-50 dark:bg-slate-800">Role</th>
                                <th className="px-6 py-4 font-medium bg-gray-50 dark:bg-slate-800">Email</th>
                                <th className="px-6 py-4 font-medium bg-gray-50 dark:bg-slate-800">Roll No</th>
                                <th className="px-6 py-4 font-medium text-right bg-gray-50 dark:bg-slate-800">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            <span>Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-slate-400 font-bold text-xs uppercase">
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-slate-100">{user.name}</span>
                                                    {user.groupId && <span className="text-xs text-gray-400 dark:text-slate-500">Has Group</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                user.role === 'teacher' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{user.email}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-slate-500">{user.rollNo || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.role !== 'admin' && (
                                                    <button onClick={() => handleResetPassword(user._id, user.name)} className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600" title="Reset Password">
                                                        <Key className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(user._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600" title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New User</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                {newUser.role === 'student' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Roll No (13 digit)</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                                value={newUser.rollNo}
                                                onChange={e => setNewUser({ ...newUser, rollNo: e.target.value })}
                                                placeholder="1234567890123"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                                value={newUser.phoneNumber}
                                                onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                                                placeholder="9876543210"
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Min 6 chars"
                                    />
                                </div>
                                <div className={newUser.role !== 'student' ? 'col-span-1' : ''}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role</label>
                                    <select
                                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                        value={newUser.role}
                                        onChange={e => {
                                            const role = e.target.value;
                                            setNewUser({
                                                ...newUser,
                                                role: role as any,
                                                // Clear student fields if switching to non-student
                                                ...(role !== 'student' ? { rollNo: '', groupId: '', subgroupId: '' } : {})
                                            });
                                        }}
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="admin">Admin</option>
                                        <option value="proctor">Proctor</option>
                                    </select>
                                </div>
                                {newUser.role !== 'student' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone Number</label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                            value={newUser.phoneNumber}
                                            onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                                            placeholder="10 digit mobile number"
                                        />
                                    </div>
                                )}
                                {newUser.role === 'student' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Group</label>
                                            <select
                                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                                value={newUser.groupId}
                                                onChange={e => {
                                                    setNewUser({ ...newUser, groupId: e.target.value, subgroupId: '' });
                                                    fetchSubgroupsForGroup(e.target.value);
                                                }}
                                            >
                                                <option value="">Select Group</option>
                                                {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subgroup</label>
                                            <select
                                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                                value={newUser.subgroupId}
                                                disabled={!newUser.groupId}
                                                onChange={e => setNewUser({ ...newUser, subgroupId: e.target.value })}
                                            >
                                                <option value="">Select Subgroup</option>
                                                {subgroups.map(s => <option key={s._id} value={s._id}>{s.name} ({s.academicYear})</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button type="submit">Create User</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
