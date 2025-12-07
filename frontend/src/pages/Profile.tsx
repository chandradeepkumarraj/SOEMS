import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { User, Mail, Phone, MapPin, Camera, Save, X, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<any>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
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

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500">Manage your account settings and preferences.</p>
                </div>
                <Button
                    variant={isEditing ? "ghost" : "primary"}
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-2"
                >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                >
                    {message.text}
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Avatar & Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                        <div className="relative inline-block mb-4">
                            <img
                                src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${formData.name}&background=random`}
                                alt="Profile"
                                className="h-32 w-32 rounded-full object-cover border-4 border-gray-50 shadow-inner"
                            />
                            {isEditing && (
                                <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-sm">
                                    <Camera className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
                        <p className="text-gray-500">{formData.role?.charAt(0).toUpperCase() + formData.role?.slice(1)}</p>
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
                                    disabled={!isEditing}
                                    icon={User}
                                />
                                <InputField
                                    label="Email Address"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
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
                                    disabled={!isEditing}
                                    icon={MapPin}
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <Edit2 className="h-5 w-5 text-gray-400" /> Bio & Avatar
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                                        <input
                                            type="text"
                                            name="avatarUrl"
                                            value={formData.avatarUrl || ''}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio || ''}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>
                                </div>
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
        </div>
    );
}

function InputField({ label, name, value, onChange, disabled, icon: Icon }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
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
