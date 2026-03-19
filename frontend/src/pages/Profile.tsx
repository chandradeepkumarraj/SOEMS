import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, getProctors } from '../services/userService';
import { getGroups, getSystemDefaults, updateSystemDefaults } from '../services/adminService';
import { User, Mail, Phone, MapPin, Save, X, Edit2, Settings, Clock, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, Key, BookOpen, ShieldCheck, ChevronDown, Users, ShieldAlert, Zap, Eye, Mic, Monitor } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PROCTORING_PRESETS } from '../config/proctoringPresets';
import { PerformanceSlider, SentinelControl } from '../components/proctoring/ProctoringControls';

export default function Profile() {
    useTranslation();
    const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<any>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [proctors, setProctors] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    // Admin System Configuration State (Consolidated from Backend)
    const [systemConfig, setSystemConfig] = useState<any>({
        examDefaults: {
            defaultDuration: 60,
            passingScore: 40,
            autoComplete: true,
            allowedTypes: {
                multipleChoice: true,
                trueFalse: true,
                code: true
            }
        },
        proctoringDefaults: {
            enableTabLock: true,
            enableFullscreen: true,
            enableInputLock: true,
            enableFaceDetection: true,
            enableVoiceDetection: true,
            enableGazeTracking: false,
            violationThreshold: 5,
            performanceSettings: {
                gazeYawThreshold: 40,
                faceScoreThreshold: 0.45,
                audioRMSThreshold: 0.010,
                violationCooldownMs: 15000
            }
        },
        maintenanceMode: false
    });

    useEffect(() => {
        const init = async () => {
            await fetchProfile();
        };
        init();
    }, []);

    useEffect(() => {
        if (formData.role === 'admin') {
            fetchSystemConfig();
        }
    }, [formData.role]);

    const fetchSystemConfig = async () => {
        try {
            const config = await getSystemDefaults();
            setSystemConfig(config);
        } catch (error) {
            console.error('Failed to load system config', error);
        }
    };

    useEffect(() => {
        if (formData.role === 'teacher' || formData.role === 'admin') {
            fetchProctorsAndGroups();
        }
    }, [formData.role]);

    const fetchProctorsAndGroups = async () => {
        try {
            const [proctorsData, groupsData] = await Promise.all([
                getProctors(),
                getGroups()
            ]);
            setProctors(proctorsData);
            setGroups(groupsData);
        } catch (error) {
            console.error('Failed to load proctors or groups', error);
        } finally {
        }
    };

    const fetchProfile = async () => {
        try {
            const data = await getUserProfile();
            setFormData(data);
        } catch (error) {
            console.error('Failed to load profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            const dataToSend = { ...formData };
            if (!dataToSend.password) delete dataToSend.password; // Don't send empty password

            // Sanitize managedGroups to send only IDs
            if (dataToSend.managedGroups && Array.isArray(dataToSend.managedGroups)) {
                dataToSend.managedGroups = dataToSend.managedGroups.map((g: any) => g._id || g);
            }

            // Sanitize departmentProctors IDs
            if (dataToSend.departmentProctors && Array.isArray(dataToSend.departmentProctors)) {
                dataToSend.departmentProctors = dataToSend.departmentProctors.map((m: any) => ({
                    groupId: m.groupId?._id || m.groupId,
                    proctorId: m.proctorId?._id || m.proctorId
                }));
            }

            await updateUserProfile(dataToSend);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    const handleSettingsSave = async () => {
        setMessage(null);
        try {
            await updateSystemDefaults(systemConfig);
            setMessage({ type: 'success', text: 'System protocols updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update system protocols.' });
        }
    };

    const applyPreset = (type: 'relaxed' | 'standard' | 'strict') => {
        setSystemConfig({
            ...systemConfig,
            proctoringDefaults: PROCTORING_PRESETS[type]
        });
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    const isAdmin = formData.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                        {activeTab === 'profile' ? 'Security Identity' : 'System Control Console'}
                    </h1>
                    <p className="text-slate-900 font-bold italic">
                        {activeTab === 'profile' ? 'Manage your scholarly credentials and access protocols.' : 'Configure industrial-grade examination environments.'}
                    </p>
                </div>
                {activeTab === 'profile' && (
                    <Button
                        variant={isEditing ? "ghost" : "primary"}
                        onClick={() => setIsEditing(!isEditing)}
                        className="gap-2"
                    >
                        {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                )}
            </div>

            {/* Tabs for Admin */}
            {isAdmin && (
                <div className="flex space-x-1 bg-[var(--bg-main)] p-1 rounded-lg w-fit transition-colors">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg' : 'text-[var(--text-main)] hover:bg-[var(--card-bg)] hover:shadow-sm'}`}
                    >
                        <User className="h-4 w-4" /> Identity
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg' : 'text-[var(--text-main)] hover:bg-[var(--card-bg)] hover:shadow-sm'}`}
                    >
                        <Settings className="h-4 w-4" /> Protocols
                    </button>
                </div>
            )}

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                >
                    {message.text}
                </motion.div>
            )}

            {activeTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Avatar & Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] text-center transition-all duration-300">
                            <div className="relative inline-block mb-4">
                                <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-gray-50 dark:border-slate-800 shadow-inner">
                                    <User className="h-16 w-16 text-primary/40" />
                                </div>
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{formData.name}</h2>
                            <p className="text-[var(--text-main)] font-black uppercase tracking-[0.2em] text-[10px] bg-[var(--bg-main)] py-1 rounded-full mt-2 border border-[var(--border-main)]">{formData.role}</p>
                        </div>

                        <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] transition-all">
                            <h3 className="font-bold text-[var(--text-main)] mb-4">Account Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-900 dark:text-slate-400 font-black uppercase tracking-widest text-[9px]">Enrolled Since</span>
                                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{new Date(formData.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-900 dark:text-slate-400 font-black uppercase tracking-widest text-[9px]">Session Status</span>
                                    <span className="px-2 py-0.5 rounded bg-green-500 text-white text-[9px] font-black uppercase">Active</span>
                                </div>
                                {formData.rollNo && (
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-500">Roll No</span>
                                        <span className="font-medium text-gray-900">{formData.rollNo}</span>
                                    </div>
                                )}
                                {formData.group && (
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-500">Group</span>
                                        <span className="font-medium text-gray-900">{formData.group.name}</span>
                                    </div>
                                )}
                                {formData.subgroup && (
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-500">Session</span>
                                        <span className="font-medium text-gray-900">{formData.subgroup.name} ({formData.subgroup.academicYear})</span>
                                    </div>
                                )}
                                {formData.institution && (
                                    <div className="flex justify-between py-2 border-t border-gray-50 mt-1">
                                        <span className="text-gray-500">Institution</span>
                                        <span className="font-medium text-gray-900">{formData.institution}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] p-6 rounded-xl shadow-[var(--shadow-main)] border border-[var(--border-main)] transition-all">
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tighter">
                                    <User className="h-5 w-5 text-primary" /> Personal Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!isEditing || formData.role === 'student'}
                                        icon={User}
                                    />
                                    <InputField
                                        label="Email Address"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={!isEditing || formData.role === 'student'}
                                        icon={Mail}
                                    />
                                    <InputField
                                        label="Phone Number"
                                        name="phoneNumber"
                                        value={formData.phoneNumber || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        icon={Phone}
                                    />
                                    <InputField
                                        label="Address"
                                        name="address"
                                        value={formData.address || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing || formData.role === 'student'}
                                        icon={MapPin}
                                    />
                                    <InputField
                                        label="Institution / School"
                                        name="institution"
                                        value={formData.institution || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        icon={BookOpen}
                                    />
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-2">Professional Biography</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio || ''}
                                            onChange={handleChange}
                                            disabled={!isEditing || formData.role === 'student'}
                                            className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-900 dark:disabled:text-slate-400 font-bold transition-all h-32 text-sm"
                                            placeholder="Write a short bio about your expertise..."
                                        />
                                    </div>
                                    {isEditing && (
                                        <InputField
                                            label="New Password (Leave blank to keep same)"
                                            name="password"
                                            type="password"
                                            value={formData.password || ''}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            icon={Key}
                                        />
                                    )}
                                </div>

                                {/* Proctor Configuration for Teachers */}
                                {(formData.role === 'teacher') && (
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tighter">
                                            <ShieldCheck className="h-5 w-5 text-primary" /> Proctor Configuration
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold italic -mt-4">
                                            Persistent settings to automate proctor assignment for all future exams you create.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Authorized Departments (Chips) - Core Scope */}
                                            <div className="md:col-span-2 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Active Departments</label>
                                                        <p className="text-[10px] text-slate-500 font-bold italic">Select the departments you currently facilitate exams for.</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2">
                                                    {groups.map((group) => {
                                                        const isSelected = formData.managedGroups?.some((mg: any) => (mg._id || mg) === group._id);
                                                        return (
                                                            <motion.button
                                                                key={group._id}
                                                                type="button"
                                                                whileHover={isEditing ? { scale: 1.05 } : {}}
                                                                whileTap={isEditing ? { scale: 0.95 } : {}}
                                                                onClick={() => {
                                                                    if (!isEditing) return;
                                                                    const currentGroups = formData.managedGroups || [];
                                                                    const exists = currentGroups.some((mg: any) => (mg._id || mg) === group._id);
                                                                    let updated;
                                                                    if (exists) {
                                                                        updated = currentGroups.filter((mg: any) => (mg._id || mg) !== group._id);
                                                                    } else {
                                                                        updated = [...currentGroups, group._id];
                                                                    }
                                                                    setFormData({ ...formData, managedGroups: updated });
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${
                                                                    isSelected 
                                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-60'
                                                                } ${!isEditing ? 'cursor-not-allowed grayscale' : 'hover:border-primary/50'}`}
                                                            >
                                                                {group.name} {isSelected && <CheckCircle className="h-3 w-3" />}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Department-Specific Proctor Mapping */}
                                            {formData.managedGroups && formData.managedGroups.length > 0 && (
                                                <div className="md:col-span-2 space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                                            <Users className="h-4 w-4 text-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Departmental Proctor Allocation</label>
                                                            <p className="text-[10px] text-slate-500 font-bold italic">Assign a dedicated proctor for each department you work in.</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {formData.managedGroups.map((mgId: any) => {
                                                            const actualId = mgId._id || mgId;
                                                            const group = groups.find(g => g._id === actualId);
                                                            if (!group) return null;

                                                            const currentMapping = formData.departmentProctors?.find((m: any) => (m.groupId?._id || m.groupId) === actualId);
                                                            const selectedProctorId = currentMapping?.proctorId?._id || currentMapping?.proctorId || '';

                                                            return (
                                                                <div key={actualId} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col gap-3 group/row transition-all hover:border-primary/30">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter flex items-center gap-2">
                                                                            <BookOpen className="h-3 w-3 text-primary" /> {group.name}
                                                                        </span>
                                                                        {selectedProctorId && <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Mapped</span>}
                                                                    </div>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={selectedProctorId}
                                                                            disabled={!isEditing}
                                                                            onChange={(e) => {
                                                                                const newProctorId = e.target.value;
                                                                                const otherMappings = (formData.departmentProctors || []).filter((m: any) => (m.groupId?._id || m.groupId) !== actualId);
                                                                                const updatedMappings = newProctorId 
                                                                                    ? [...otherMappings, { groupId: actualId, proctorId: newProctorId }]
                                                                                    : otherMappings;
                                                                                setFormData({ ...formData, departmentProctors: updatedMappings });
                                                                            }}
                                                                            className="w-full pl-3 pr-10 py-2 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary disabled:opacity-50 text-[11px] font-bold text-slate-900 dark:text-slate-100 transition-all appearance-none outline-none"
                                                                        >
                                                                            <option value="">Select a Proctor...</option>
                                                                            {proctors.map((proctor) => (
                                                                                <option key={proctor._id} value={proctor._id}>{proctor.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-hover/row:text-primary transition-colors">
                                                                            <ChevronDown className="h-3 w-3" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Assessment Presets for Teachers/Proctors */}
                                {(formData.role === 'teacher' || formData.role === 'proctor') && (
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tighter">
                                            <Zap className="h-5 w-5 text-primary" /> Assessment Presets
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold italic -mt-4">
                                            Define your personal default proctoring intensities. These can be quickly applied when creating new exams.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <SentinelControl 
                                                icon={Eye} 
                                                label="Gaze Tracking" 
                                                active={formData.proctoringPresets?.enableGazeTracking}
                                                disabled={!isEditing}
                                                toggle={() => {
                                                    if (!isEditing) return;
                                                    setFormData({
                                                        ...formData,
                                                        proctoringPresets: { 
                                                            ...formData.proctoringPresets, 
                                                            enableGazeTracking: !formData.proctoringPresets?.enableGazeTracking 
                                                        }
                                                    });
                                                }}
                                            />
                                            <SentinelControl 
                                                icon={User} 
                                                label="Face Detection" 
                                                active={formData.proctoringPresets?.enableFaceDetection}
                                                disabled={!isEditing}
                                                toggle={() => {
                                                    if (!isEditing) return;
                                                    setFormData({
                                                        ...formData,
                                                        proctoringPresets: { 
                                                            ...formData.proctoringPresets, 
                                                            enableFaceDetection: !formData.proctoringPresets?.enableFaceDetection 
                                                        }
                                                    });
                                                }}
                                            />
                                            <SentinelControl 
                                                icon={Mic} 
                                                label="Voice Detection" 
                                                active={formData.proctoringPresets?.enableVoiceDetection}
                                                disabled={!isEditing}
                                                toggle={() => {
                                                    if (!isEditing) return;
                                                    setFormData({
                                                        ...formData,
                                                        proctoringPresets: { 
                                                            ...formData.proctoringPresets, 
                                                            enableVoiceDetection: !formData.proctoringPresets?.enableVoiceDetection 
                                                        }
                                                    });
                                                }}
                                            />
                                            <SentinelControl 
                                                icon={Monitor} 
                                                label="Tab Lockout" 
                                                active={formData.proctoringPresets?.enableTabLock}
                                                disabled={!isEditing}
                                                toggle={() => {
                                                    if (!isEditing) return;
                                                    setFormData({
                                                        ...formData,
                                                        proctoringPresets: { 
                                                            ...formData.proctoringPresets, 
                                                            enableTabLock: !formData.proctoringPresets?.enableTabLock 
                                                        }
                                                    });
                                                }}
                                            />
                                            <SentinelControl 
                                                icon={ShieldCheck} 
                                                label="Input Lockout" 
                                                active={formData.proctoringPresets?.enableInputLock}
                                                disabled={!isEditing}
                                                toggle={() => {
                                                    if (!isEditing) return;
                                                    setFormData({
                                                        ...formData,
                                                        proctoringPresets: { 
                                                            ...formData.proctoringPresets, 
                                                            enableInputLock: !formData.proctoringPresets?.enableInputLock 
                                                        }
                                                    });
                                                }}
                                            />
                                            <SentinelControl 
                                                icon={ShieldAlert} 
                                                label="Fullscreen Mode" 
                                                active={formData.proctoringPresets?.enableFullscreen}
                                                disabled={!isEditing}
                                                toggle={() => {
                                                    if (!isEditing) return;
                                                    setFormData({
                                                        ...formData,
                                                        proctoringPresets: { 
                                                            ...formData.proctoringPresets, 
                                                            enableFullscreen: !formData.proctoringPresets?.enableFullscreen 
                                                        }
                                                    });
                                                }}
                                            />
                                        </div>

                                        {/* Nested Performance Sliders for Personal Presets */}
                                        <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="col-span-full border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Fine-Tuned Performance Thresholds</h4>
                                                <p className="text-[9px] text-slate-500 font-bold italic mt-1">Adjust AI sensitivity for gaze, face, and voice detection.</p>
                                            </div>

                                            <PerformanceSlider
                                                label="Head-Turn Limit"
                                                description="Strictness for detected head movements."
                                                value={formData.proctoringPresets?.performanceSettings?.gazeYawThreshold || 40}
                                                min={10} max={90} step={5}
                                                unit="°"
                                                disabled={!isEditing || !formData.proctoringPresets?.enableGazeTracking}
                                                onChange={(val) => setFormData({
                                                    ...formData,
                                                    proctoringPresets: {
                                                        ...formData.proctoringPresets,
                                                        performanceSettings: { ...formData.proctoringPresets?.performanceSettings, gazeYawThreshold: val }
                                                    }
                                                })}
                                            />
                                            <PerformanceSlider
                                                label="Presence Sensitivity"
                                                description="How strictly AI confirms student presence."
                                                value={formData.proctoringPresets?.performanceSettings?.faceScoreThreshold || 0.45}
                                                min={0.1} max={0.9} step={0.05}
                                                disabled={!isEditing || !formData.proctoringPresets?.enableFaceDetection}
                                                onChange={(val) => setFormData({
                                                    ...formData,
                                                    proctoringPresets: {
                                                        ...formData.proctoringPresets,
                                                        performanceSettings: { ...formData.proctoringPresets?.performanceSettings, faceScoreThreshold: val }
                                                    }
                                                })}
                                            />
                                            <PerformanceSlider
                                                label="Speaking Detection"
                                                description="Adjust to ignore low background noise."
                                                value={formData.proctoringPresets?.performanceSettings?.audioRMSThreshold || 0.010}
                                                min={0.001} max={0.05} step={0.001}
                                                disabled={!isEditing || !formData.proctoringPresets?.enableVoiceDetection}
                                                onChange={(val) => setFormData({
                                                    ...formData,
                                                    proctoringPresets: {
                                                        ...formData.proctoringPresets,
                                                        performanceSettings: { ...formData.proctoringPresets?.performanceSettings, audioRMSThreshold: val }
                                                    }
                                                })}
                                            />
                                            <PerformanceSlider
                                                label="Alert Wait Time"
                                                description="Buffer between consecutive warnings."
                                                value={formData.proctoringPresets?.performanceSettings?.violationCooldownMs || 15000}
                                                min={5000} max={60000} step={5000}
                                                unit="ms"
                                                disabled={!isEditing}
                                                onChange={(val) => setFormData({
                                                    ...formData,
                                                    proctoringPresets: {
                                                        ...formData.proctoringPresets,
                                                        performanceSettings: { ...formData.proctoringPresets?.performanceSettings, violationCooldownMs: val }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                )}


                                {isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="pt-6 border-t border-gray-100 flex justify-end"
                                    >
                                        <Button type="submit" className="gap-2">
                                            <Save className="h-4 w-4" /> Save Changes
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* Sentinel AI Infrastructure - Enhanced Protocols */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-primary/5 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3 mb-8 uppercase tracking-tighter">
                                <ShieldAlert className="h-6 w-6 text-primary" /> Sentinel AI Protocols
                            </h3>

                            {/* Presets Selection */}
                            <div className="mb-10">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4 text-center">Proctoring Intensity Presets</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'relaxed', label: 'Relaxed', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                        { id: 'standard', label: 'Standard', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                        { id: 'strict', label: 'Strict', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
                                    ].map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset.id as any)}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${
                                                (preset.id === 'strict' && systemConfig.proctoringDefaults.enableGazeTracking) ||
                                                (preset.id === 'relaxed' && !systemConfig.proctoringDefaults.enableTabLock) ||
                                                (preset.id === 'standard' && systemConfig.proctoringDefaults.enableTabLock && !systemConfig.proctoringDefaults.enableGazeTracking)
                                                ? `${preset.border} ${preset.bg} ring-4 ring-primary/5`
                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <preset.icon className={`h-6 w-6 ${preset.color}`} />
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">{preset.label} Mode</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Essential Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] col-span-full">Essential Proctoing Protections</h4>
                                
                                <SentinelControl 
                                    icon={Eye} 
                                    label="Look-Away Detection" 
                                    active={systemConfig.proctoringDefaults.enableGazeTracking}
                                    toggle={() => setSystemConfig({
                                        ...systemConfig,
                                        proctoringDefaults: { ...systemConfig.proctoringDefaults, enableGazeTracking: !systemConfig.proctoringDefaults.enableGazeTracking }
                                    })}
                                />
                                <SentinelControl 
                                    icon={User} 
                                    label="Presence Check" 
                                    active={systemConfig.proctoringDefaults.enableFaceDetection}
                                    toggle={() => setSystemConfig({
                                        ...systemConfig,
                                        proctoringDefaults: { ...systemConfig.proctoringDefaults, enableFaceDetection: !systemConfig.proctoringDefaults.enableFaceDetection }
                                    })}
                                />
                                <SentinelControl 
                                    icon={Mic} 
                                    label="Talk Detection" 
                                    active={systemConfig.proctoringDefaults.enableVoiceDetection}
                                    toggle={() => setSystemConfig({
                                        ...systemConfig,
                                        proctoringDefaults: { ...systemConfig.proctoringDefaults, enableVoiceDetection: !systemConfig.proctoringDefaults.enableVoiceDetection }
                                    })}
                                />
                                <SentinelControl 
                                    icon={Monitor} 
                                    label="Lock Other Tabs" 
                                    active={systemConfig.proctoringDefaults.enableTabLock}
                                    toggle={() => setSystemConfig({
                                        ...systemConfig,
                                        proctoringDefaults: { ...systemConfig.proctoringDefaults, enableTabLock: !systemConfig.proctoringDefaults.enableTabLock }
                                    })}
                                />
                                <SentinelControl 
                                    icon={ShieldCheck} 
                                    label="Stop Copy-Paste" 
                                    active={systemConfig.proctoringDefaults.enableInputLock}
                                    toggle={() => setSystemConfig({
                                        ...systemConfig,
                                        proctoringDefaults: { ...systemConfig.proctoringDefaults, enableInputLock: !systemConfig.proctoringDefaults.enableInputLock }
                                    })}
                                />
                                <SentinelControl 
                                    icon={Zap} 
                                    label="Auto-Submission" 
                                    active={systemConfig.examDefaults.autoComplete}
                                    toggle={() => setSystemConfig({
                                        ...systemConfig,
                                        examDefaults: { ...systemConfig.examDefaults, autoComplete: !systemConfig.examDefaults.autoComplete }
                                    })}
                                />

                                {/* Admin Global Performance Settings */}
                                <div className="col-span-full mt-6 bg-slate-50 dark:bg-slate-800/20 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="col-span-full border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Zap className="h-4 w-4" /> Fine-Tune AI Sensitivity
                                        </h4>
                                        <p className="text-[10px] text-slate-500 font-bold italic mt-1">Adjust how strictly the AI monitors the examination environment.</p>
                                    </div>

                                    <PerformanceSlider
                                        label="Head-Turn Limit"
                                        description="Sensitivity for detecting when a student looks away."
                                        value={systemConfig.proctoringDefaults.performanceSettings?.gazeYawThreshold || 40}
                                        min={10} max={90} step={5}
                                        unit="°"
                                        disabled={!systemConfig.proctoringDefaults.enableGazeTracking}
                                        onChange={(val) => setSystemConfig({
                                            ...systemConfig,
                                            proctoringDefaults: {
                                                ...systemConfig.proctoringDefaults,
                                                performanceSettings: { ...systemConfig.proctoringDefaults.performanceSettings, gazeYawThreshold: val }
                                            }
                                        })}
                                    />
                                    <PerformanceSlider
                                        label="Face Detection Accuracy"
                                        description="Higher means the AI must be very sure it sees a face."
                                        value={systemConfig.proctoringDefaults.performanceSettings?.faceScoreThreshold || 0.45}
                                        min={0.1} max={0.9} step={0.05}
                                        disabled={!systemConfig.proctoringDefaults.enableFaceDetection}
                                        onChange={(val) => setSystemConfig({
                                            ...systemConfig,
                                            proctoringDefaults: {
                                                ...systemConfig.proctoringDefaults,
                                                performanceSettings: { ...systemConfig.proctoringDefaults.performanceSettings, faceScoreThreshold: val }
                                            }
                                        })}
                                    />
                                    <PerformanceSlider
                                        label="Microphone Sensitivity"
                                        description="How easily the AI picks up whispering or noise."
                                        value={systemConfig.proctoringDefaults.performanceSettings?.audioRMSThreshold || 0.010}
                                        min={0.001} max={0.05} step={0.001}
                                        disabled={!systemConfig.proctoringDefaults.enableVoiceDetection}
                                        onChange={(val) => setSystemConfig({
                                            ...systemConfig,
                                            proctoringDefaults: {
                                                ...systemConfig.proctoringDefaults,
                                                performanceSettings: { ...systemConfig.proctoringDefaults.performanceSettings, audioRMSThreshold: val }
                                            }
                                        })}
                                    />
                                    <PerformanceSlider
                                        label="Wait Between Alerts"
                                        description="Time to wait before issuing a new cheating warning."
                                        value={systemConfig.proctoringDefaults.performanceSettings?.violationCooldownMs || 15000}
                                        min={5000} max={60000} step={5000}
                                        unit="ms"
                                        onChange={(val) => setSystemConfig({
                                            ...systemConfig,
                                            proctoringDefaults: {
                                                ...systemConfig.proctoringDefaults,
                                                performanceSettings: { ...systemConfig.proctoringDefaults.performanceSettings, violationCooldownMs: val }
                                            }
                                        })}
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800 mb-8" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Temporal & Grading Logic</h4>
                                    <label className="block">
                                        <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 mb-3">
                                            <Clock className="h-4 w-4 text-primary" /> Default Duration (Mins)
                                        </span>
                                        <input
                                            type="number"
                                            value={systemConfig.examDefaults.defaultDuration}
                                            onChange={(e) => setSystemConfig({ 
                                                ...systemConfig, 
                                                examDefaults: { ...systemConfig.examDefaults, defaultDuration: parseInt(e.target.value) } 
                                            })}
                                            className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary transition-all text-sm font-bold text-slate-900 dark:text-white"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 mb-3">
                                            <ShieldAlert className="h-4 w-4 text-primary" /> Max Cheating Warnings
                                        </span>
                                        <input
                                            type="number"
                                            value={systemConfig.proctoringDefaults.violationThreshold}
                                            onChange={(e) => setSystemConfig({ 
                                                ...systemConfig, 
                                                proctoringDefaults: { ...systemConfig.proctoringDefaults, violationThreshold: parseInt(e.target.value) } 
                                            })}
                                            className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary transition-all text-sm font-bold text-slate-900 dark:text-white"
                                        />
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Sanctioned Question Architectures</h4>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'multipleChoice', label: 'Multiple Choice Lexicon' },
                                            { id: 'trueFalse', label: 'Binary Assertions (T/F)' },
                                            { id: 'code', label: 'Algorithmic Synthesizer' }
                                        ].map((type) => (
                                            <label key={type.id} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer">
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{type.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={systemConfig.examDefaults.allowedTypes[type.id]}
                                                    onChange={(e) => setSystemConfig({
                                                        ...systemConfig,
                                                        examDefaults: {
                                                            ...systemConfig.examDefaults,
                                                            allowedTypes: { ...systemConfig.examDefaults.allowedTypes, [type.id]: e.target.checked }
                                                        }
                                                    })}
                                                    className="h-5 w-5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Crisis Management & Maintenance */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-rose-500/5 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3 mb-2 uppercase tracking-tighter">
                                <AlertTriangle className="h-6 w-6 text-rose-500" /> Maintenance Protocol
                            </h3>
                            <p className="text-slate-500 text-xs font-bold leading-relaxed italic">
                                Engaging this protocol will restrict access to all non-administrative personnel. Current sessions will remain active until termination.
                            </p>
                        </div>
                        <div className="flex justify-end p-2">
                            <button
                                onClick={() => setSystemConfig({ ...systemConfig, maintenanceMode: !systemConfig.maintenanceMode })}
                                className={`flex items-center gap-4 px-6 py-4 rounded-3xl border-2 transition-all group ${
                                    systemConfig.maintenanceMode 
                                    ? 'bg-rose-500/10 border-rose-500/30 ring-8 ring-rose-500/5' 
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                                }`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest ${systemConfig.maintenanceMode ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {systemConfig.maintenanceMode ? 'Protocol Active' : 'Protocol Dormant'}
                                </span>
                                {systemConfig.maintenanceMode ? (
                                    <ToggleRight className="h-10 w-10 text-rose-500" />
                                ) : (
                                    <ToggleLeft className="h-10 w-10 text-slate-300 group-hover:text-slate-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button 
                            onClick={handleSettingsSave} 
                            className="bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 flex items-center gap-3 group transition-all hover:scale-105 active:scale-95"
                        >
                            <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" /> 
                            Commit System protocols
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function InputField({ label, name, value, onChange, disabled, icon: Icon, type = "text" }: { 
    label: string, 
    name: string, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    disabled?: boolean, 
    icon: any, 
    type?: string 
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className="pl-10 block w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold transition-all text-sm"
                />
            </div>
        </div>
    );
}
