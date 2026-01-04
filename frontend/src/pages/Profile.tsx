import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { User, Mail, Phone, MapPin, Save, X, Edit2, Settings, Clock, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, Key, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';

export default function Profile() {
    const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<any>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Admin Settings State
    const [adminSettings, setAdminSettings] = useState({
        defaultDuration: 60,
        passingScore: 40,
        allowedTypes: {
            multipleChoice: true,
            trueFalse: true,
            code: true
        },
        maintenanceMode: false
    });

    useEffect(() => {
        fetchProfile();
        // Load admin settings from local storage mock
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            setAdminSettings(JSON.parse(savedSettings));
        }
    }, []);

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

            await updateUserProfile(dataToSend);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    const handleSettingsSave = () => {
        localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
        setMessage({ type: 'success', text: 'System settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
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
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'profile' ? 'My Profile' : 'System Settings'}
                    </h1>
                    <p className="text-gray-500">
                        {activeTab === 'profile' ? 'Manage your account settings and preferences.' : 'Configure global system settings.'}
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
                <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User className="h-4 w-4" /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Settings className="h-4 w-4" /> Settings
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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                            <div className="relative inline-block mb-4">
                                <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-gray-50 shadow-inner">
                                    <User className="h-16 w-16 text-primary/40" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
                            <p className="text-gray-500 capitalize">{formData.role}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">Account Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Member Since</span>
                                    <span className="font-medium text-gray-900">{new Date(formData.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Status</span>
                                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">Active</span>
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
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <User className="h-5 w-5 text-gray-400" /> Personal Information
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio || ''}
                                            onChange={handleChange}
                                            disabled={!isEditing || formData.role === 'student'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500 transition-colors h-24"
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
                    {/* Global Questions Configuration */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <Settings className="h-5 w-5 text-gray-400" /> Questions Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                                        <Clock className="h-4 w-4 text-gray-400" /> Default Exam Duration (mins)
                                    </span>
                                    <input
                                        type="number"
                                        value={adminSettings.defaultDuration}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, defaultDuration: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                                        <CheckCircle className="h-4 w-4 text-gray-400" /> Default Passing Score (%)
                                    </span>
                                    <input
                                        type="number"
                                        value={adminSettings.passingScore}
                                        onChange={(e) => setAdminSettings({ ...adminSettings, passingScore: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </label>
                            </div>

                            <div className="space-y-3">
                                <span className="text-sm font-medium text-gray-700 block mb-1">Allowed Question Types</span>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={adminSettings.allowedTypes.multipleChoice}
                                            onChange={(e) => setAdminSettings({
                                                ...adminSettings,
                                                allowedTypes: { ...adminSettings.allowedTypes, multipleChoice: e.target.checked }
                                            })}
                                            className="h-4 w-4 text-primary rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700">Multiple Choice</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={adminSettings.allowedTypes.trueFalse}
                                            onChange={(e) => setAdminSettings({
                                                ...adminSettings,
                                                allowedTypes: { ...adminSettings.allowedTypes, trueFalse: e.target.checked }
                                            })}
                                            className="h-4 w-4 text-primary rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700">True / False</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={adminSettings.allowedTypes.code}
                                            onChange={(e) => setAdminSettings({
                                                ...adminSettings,
                                                allowedTypes: { ...adminSettings.allowedTypes, code: e.target.checked }
                                            })}
                                            className="h-4 w-4 text-primary rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700">Code Challenge</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Maintenance */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <AlertTriangle className="h-5 w-5 text-orange-500" /> System Params
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                            <div>
                                <h4 className="font-medium text-orange-900">Maintenance Mode</h4>
                                <p className="text-sm text-orange-700 mt-1">Prevents non-admin users from logging in.</p>
                            </div>
                            <button
                                onClick={() => setAdminSettings({ ...adminSettings, maintenanceMode: !adminSettings.maintenanceMode })}
                                className={`text-2xl transition-colors ${adminSettings.maintenanceMode ? 'text-primary' : 'text-gray-300'}`}
                            >
                                {adminSettings.maintenanceMode ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSettingsSave} className="gap-2">
                            <Save className="h-4 w-4" /> Save Configuration
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function InputField({ label, name, value, onChange, disabled, icon: Icon, type = "text" }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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
                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                />
            </div>
        </div>
    );
}
