import { useState, useEffect } from 'react';
import { Trash2, Users, Layers, Upload, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import UserList from '../../components/admin/users/UserList';
import BulkImportWizard from '../../components/admin/users/BulkImportWizard';
import { getGroups, getSubgroups, createGroup, createSubgroup, deleteGroup, deleteSubgroup } from '../../services/adminService';

export default function UserManagementPage() {
    // ... state
    const [groups, setGroups] = useState<any[]>([]);
    const [subgroups, setSubgroups] = useState<any[]>([]);
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [showHierarchyModal, setShowHierarchyModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchHierarchy = async () => {
        try {
            const [g, s] = await Promise.all([getGroups(), getSubgroups()]);
            setGroups(g);
            setSubgroups(s);
        } catch (error) {
            console.error('Failed to fetch hierarchy', error);
        }
    };

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const handleImportSuccess = () => {
        setMsg({ type: 'success', text: 'Users imported successfully' });
        setShowImportWizard(false);
        setRefreshTrigger(prev => prev + 1);
        fetchHierarchy();
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('groupName') as HTMLInputElement).value;
        try {
            await createGroup({ name });
            fetchHierarchy();
            setMsg({ type: 'success', text: 'Group created successfully' });
            form.reset();
        } catch (error) {
            setMsg({ type: 'error', text: 'Failed to create group' });
        }
    };

    const handleCreateSubgroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const groupId = (form.elements.namedItem('groupId') as HTMLSelectElement).value;
        const name = (form.elements.namedItem('subName') as HTMLInputElement).value;
        const year = (form.elements.namedItem('year') as HTMLInputElement).value;

        try {
            await createSubgroup({ groupId, name, academicYear: year });
            fetchHierarchy();
            setMsg({ type: 'success', text: 'Session created successfully' });
            form.reset();
        } catch (error) {
            setMsg({ type: 'error', text: 'Failed to create session' });
        }
    };

    const handleDeleteGroup = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete group "${name}"?\n\nCRITICAL WARNING: This will PERMANENTLY delete ALL subgroups, students, and their exam results belonging to this group. This action cannot be undone.`)) {
            try {
                await deleteGroup(id);
                fetchHierarchy();
                setMsg({ type: 'success', text: 'Group deleted successfully' });
            } catch (error) {
                alert('Failed to delete group');
            }
        }
    };

    const handleDeleteSubgroup = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete session "${name}"?\n\nCRITICAL WARNING: This will PERMANENTLY delete ALL students and their exam results belonging to this session. This action cannot be undone.`)) {
            try {
                await deleteSubgroup(id);
                fetchHierarchy();
                setMsg({ type: 'success', text: 'Session deleted successfully' });
            } catch (error) {
                alert('Failed to delete session');
            }
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" /> User Management
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400">Manage students, teachers, and system administrators.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowHierarchyModal(true)}>
                        <Layers className="h-4 w-4 mr-2" />
                        Manage Groups
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportWizard(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Import
                    </Button>
                </div>
            </header>

            {msg && (
                <div className={`p-4 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {msg.text}
                </div>
            )}

            {/* Main Content */}
            <UserList refreshTrigger={refreshTrigger} />

            {/* Import Wizard Modal */}
            {showImportWizard && (
                <BulkImportWizard
                    onClose={() => setShowImportWizard(false)}
                    onSuccess={handleImportSuccess}
                    groups={groups}
                    subgroups={subgroups}
                />
            )}

            {/* Hierarchy Modal */}
            {showHierarchyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full p-6 animate-in fade-in zoom-in duration-200 h-[80vh] flex flex-col border border-gray-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <Layers className="text-primary h-6 w-6" />
                                Manage Hierarchy
                            </h3>
                            <button onClick={() => setShowHierarchyModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 flex-1 overflow-hidden">
                            {/* Create Group */}
                            <div className="flex flex-col h-full">
                                <h4 className="font-bold text-gray-900 dark:text-slate-100 border-b dark:border-slate-800 pb-2 mb-4">Groups</h4>
                                <form onSubmit={handleCreateGroup} className="space-y-3 mb-6">
                                    <div className="flex gap-2">
                                        <input name="groupName" required className="flex-1 px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white" placeholder="New Group Name" />
                                        <Button type="submit" size="sm">Add</Button>
                                    </div>
                                </form>

                                <div className="flex-1 overflow-y-auto border dark:border-slate-800 rounded-lg divide-y dark:divide-slate-800 bg-gray-50 dark:bg-slate-950/50">
                                    {groups.map(g => (
                                        <div key={g._id} className="p-3 text-sm flex justify-between items-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{g.name}</span>
                                            <button
                                                onClick={() => handleDeleteGroup(g._id, g.name)}
                                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Group"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {groups.length === 0 && <p className="p-4 text-center text-gray-500 text-xs">No groups found.</p>}
                                </div>
                            </div>

                            {/* Create Subgroup */}
                            <div className="flex flex-col h-full">
                                <h4 className="font-bold text-gray-900 dark:text-slate-100 border-b dark:border-slate-800 pb-2 mb-4">Sessions / Subgroups</h4>
                                <form onSubmit={handleCreateSubgroup} className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-950/50 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Parent Group</label>
                                        <select name="groupId" required className="w-full px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white">
                                            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <input name="subName" required className="w-full px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white" placeholder="Session Name" />
                                        </div>
                                        <div>
                                            <input name="year" required className="w-full px-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white" placeholder="Year (e.g. 2024)" />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" size="sm">Add Session</Button>
                                </form>

                                <div className="flex-1 overflow-y-auto border dark:border-slate-800 rounded-lg divide-y dark:divide-slate-800 bg-gray-50 dark:bg-slate-950/50">
                                    {subgroups.map(s => (
                                        <div key={s._id} className="p-3 text-sm flex justify-between items-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{s.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-slate-500">{s.groupId?.name || 'Unknown Group'} • {s.academicYear}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSubgroup(s._id, s.name)}
                                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Session"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {subgroups.length === 0 && <p className="p-4 text-center text-gray-500 text-xs">No sessions found.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
