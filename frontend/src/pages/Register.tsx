import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, GraduationCap, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { register, getCurrentUser } from '../services/authService';

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/dashboard');
        }
    }, [navigate]);
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        institution: '',
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            await register({
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                password: formData.password,
                role
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    const roles = [
        { id: 'student', icon: GraduationCap, label: 'Student', description: 'Take exams and view results', color: 'bg-blue-500' },
        { id: 'teacher', icon: BookOpen, label: 'Teacher', description: 'Create and manage exams', color: 'bg-emerald-500' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-gray-50 to-gray-50" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="text-center">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <Shield className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold text-primary-dark">SOEMS</span>
                    </Link>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join thousands of students and teachers today
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-xl rounded-2xl border border-white/50 sm:px-10">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                        <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                        <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-4"
                                >
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Account Type</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        {roles.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setRole(item.id as any)}
                                                className={`relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all ${role === item.id
                                                    ? `border-${item.color.replace('bg-', '')} bg-blue-50/30`
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className={`p-3 rounded-full ${item.color} text-white mr-4`}>
                                                    <item.icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900">{item.label}</h3>
                                                    <p className="text-sm text-gray-500">{item.description}</p>
                                                </div>
                                                {role === item.id && (
                                                    <CheckCircle2 className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full mt-6"
                                        onClick={() => setStep(2)}
                                    >
                                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="First Name"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Last Name"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Institution / School"
                                        value={formData.institution}
                                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />

                                    <div className="flex gap-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setStep(1)}
                                        >
                                            Back
                                        </Button>
                                        <Button type="submit" className="flex-1">
                                            Create Account
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
