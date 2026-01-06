import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser, createUser, importUsersCode, exportUsersUrl, resetUserPassword, getGroups, getSubgroups, createGroup, createSubgroup } from '../../services/adminService';
import { Search, UserPlus, Trash2, Download, Upload, Loader, X, Key, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showHierarchyModal, setShowHierarchyModal] = useState(false);

    // Hierarchy State
    const [groups, setGroups] = useState<any[]>([]);
    const [subgroups, setSubgroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSubgroup, setSelectedSubgroup] = useState('');

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

    // Import State
    const [importErrors, setImportErrors] = useState<any[] | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchGroups()]);
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchGroups = async () => {
        try {
            const data = await getGroups();
            setGroups(data);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        }
    };

    useEffect(() => {
        if (selectedGroup) {
            fetchSubgroups(selectedGroup);
        } else {
            setSubgroups([]);
            setSelectedSubgroup('');
        }
    }, [selectedGroup]);

    const fetchSubgroups = async (groupId: string) => {
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
            } catch (error) {
                alert('Failed to delete user');
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
                name: '',
                email: '',
                password: '',
                role: 'student',
                rollNo: '',
                phoneNumber: '',
                groupId: '',
                subgroupId: ''
            });
            setMsg({ type: 'success', text: `User ${created.name} created!` });
            setTimeout(() => setMsg(null), 3000);
        } catch (error: any) {
            setMsg({ type: 'error', text: error.response?.data?.message || 'Failed to create user' });
        }
    };

    const handleImportCSV = async (e: React.FormEvent) => {
        e.preventDefault();
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            if (selectedGroup) formData.append('groupId', selectedGroup);
            if (selectedSubgroup) formData.append('subgroupId', selectedSubgroup);

            try {
                setLoading(true);
                setImportErrors(null);
                setImportSuccess(null);
                const res = await importUsersCode(formData);

                if (res.errors) {
                    setImportErrors(res.errors);
                    setMsg({ type: 'error', text: `Import completed with ${res.errors.length} errors.` });
                } else {
                    setImportSuccess(res.message);
                    setMsg({ type: 'success', text: res.message });
                    setTimeout(() => setShowImportModal(false), 2000);
                }
                fetchUsers();
            } catch (error: any) {
                setMsg({ type: 'error', text: 'Import failed: ' + (error.response?.data?.message || error.message) });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleResetPassword = async (userId: string, userName: string) => {
        const newPassword = prompt(`Enter new password for ${userName}:`);
        if (newPassword && newPassword.length >= 6) {
            try {
                await resetUserPassword(userId, newPassword);
                setMsg({ type: 'success', text: `Password reset for ${userName}` });
                setTimeout(() => setMsg(null), 3000);
            } catch (error) {
                setMsg({ type: 'error', text: 'Failed to reset password' });
            }
        } else if (newPassword) {
            alert('Password must be at least 6 characters');
        }
    };



    const filteredUsers = users.filter((u: any) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setShowHierarchyModal(true)}>
                        <Layers className="h-4 w-4 mr-2" />
                        Hierarchy
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddModal(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportModal(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </Button>
                    <Button variant="outline" onClick={async () => {
                        const url = await exportUsersUrl();
                        window.location.href = url;
                    }}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {msg && (
                <div className={`p-4 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {msg.text}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12"><Loader className="animate-spin text-primary" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                    <th className="px-6 py-4 font-medium">ID/Roll No</th>
                                    <th className="px-6 py-4 font-medium">Phone</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.length > 0 ? filteredUsers.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'teacher' ? 'bg-emerald-100 text-emerald-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.role === 'student' ? (
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.rollNo || 'N/A'}</span>
                                            ) : (
                                                <span className="text-gray-400">---</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.phoneNumber || (user.role === 'student' ? <span className="text-red-400">Missing</span> : <span className="text-gray-400">---</span>)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleResetPassword(user._id, user.name)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add New User</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                {newUser.role === 'student' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Roll No (13 digit)</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                                                value={newUser.rollNo}
                                                onChange={e => setNewUser({ ...newUser, rollNo: e.target.value })}
                                                placeholder="1234567890123"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (10 digit)</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                                                value={newUser.phoneNumber}
                                                onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                                                placeholder="9876543210"
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="admin">Admin</option>
                                        <option value="proctor">Proctor</option>
                                    </select>
                                </div>
                                {newUser.role === 'student' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                                                value={newUser.groupId}
                                                onChange={e => {
                                                    setNewUser({ ...newUser, groupId: e.target.value, subgroupId: '' });
                                                    fetchSubgroups(e.target.value);
                                                }}
                                            >
                                                <option value="">Select Group</option>
                                                {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subgroup</label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
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

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Bulk Import Students</h3>
                            <button onClick={() => { setShowImportModal(false); setImportErrors(null); setImportSuccess(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImportCSV} className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                                <p className="font-bold mb-1">Instructions:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>CSV columns: <b>name, email, rollNo, phoneNumber</b></li>
                                    <li>Roll No must be 13 digits.</li>
                                    <li>Phone number must be 10 digits.</li>
                                    <li>Optionally include <b>password, role</b>.</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Group</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={selectedGroup}
                                        onChange={e => setSelectedGroup(e.target.value)}
                                    >
                                        <option value="">Broad Group (Optional)</option>
                                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Subgroup</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={selectedSubgroup}
                                        disabled={!selectedGroup}
                                        onChange={e => setSelectedSubgroup(e.target.value)}
                                    >
                                        <option value="">Select Session (Optional)</option>
                                        {subgroups.map(s => <option key={s._id} value={s._id}>{s.name} ({s.academicYear})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    required
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                            </div>

                            {importSuccess && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {importSuccess}
                                </div>
                            )}

                            {importErrors && (
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Validation Errors Found:
                                    </p>
                                    <div className="max-h-40 overflow-y-auto text-xs bg-red-50 border border-red-100 rounded-lg p-2 space-y-1">
                                        {importErrors.map((err, idx) => (
                                            <div key={idx} className="border-b border-red-200 pb-1 last:border-0">
                                                <span className="font-bold">Row {err.row} ({err.name}):</span>
                                                <ul className="list-disc list-inside text-red-700 pl-2">
                                                    {err.errors.map((msg: string, midx: number) => <li key={midx}>{msg}</li>)}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => { setShowImportModal(false); setImportErrors(null); }}>Cancel</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                    Upload & Process
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hierarchy Modal */}
            {showHierarchyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Layers className="text-primary h-6 w-6" />
                                Manage Hierarchy
                            </h3>
                            <button onClick={() => setShowHierarchyModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Create Group */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 border-b pb-2">Create Broad Group</h4>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const name = (e.target as any).groupName.value;
                                    try {
                                        await createGroup({ name });
                                        fetchGroups();
                                        (e.target as any).reset();
                                        setMsg({ type: 'success', text: 'Group created successfully' });
                                    } catch (err: any) {
                                        setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create group' });
                                    }
                                }} className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Group Name</label>
                                        <input name="groupName" required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. B.Tech" />
                                    </div>
                                    <Button type="submit" className="w-full" size="sm">Add Group</Button>
                                </form>

                                <div className="space-y-1 mt-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Existing Groups</p>
                                    <div className="max-h-32 overflow-y-auto border rounded-lg divide-y bg-gray-50">
                                        {groups.map(g => (
                                            <div key={g._id} className="p-2 text-sm flex justify-between items-center">
                                                <span>{g.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Create Subgroup */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 border-b pb-2">Add Session/Subgroup</h4>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as any;
                                    try {
                                        await createSubgroup({
                                            name: form.subName.value,
                                            groupId: form.groupId.value,
                                            academicYear: form.year.value
                                        });
                                        if (selectedGroup === form.groupId.value) fetchSubgroups(selectedGroup);
                                        form.reset();
                                        setMsg({ type: 'success', text: 'Subgroup created successfully' });
                                    } catch (err: any) {
                                        setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create subgroup' });
                                    }
                                }} className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Parent Group</label>
                                        <select name="groupId" required className="w-full px-3 py-2 border rounded-lg text-sm">
                                            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Session/Name</label>
                                            <input name="subName" required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Session A" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Academic Year</label>
                                            <input name="year" required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 2024-25" />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" size="sm">Add Session</Button>
                                </form>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button variant="ghost" onClick={() => setShowHierarchyModal(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
