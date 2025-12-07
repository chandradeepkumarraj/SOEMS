import React, { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, GraduationCap, BookOpen, Lock, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { login } from '../services/authService';

export default function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | 'proctor'>('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Ref for the email input to handle auto-focus and scrolling
    const emailInputRef = useRef<HTMLInputElement>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleRoleSelect = (newRole: typeof role) => {
        setRole(newRole);
        // Small delay to allow state update and animation to start
        setTimeout(() => {
            if (emailInputRef.current) {
                emailInputRef.current.focus();
                emailInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const roles = [
        { id: 'student', icon: GraduationCap, label: 'Student', color: 'bg-blue-500' },
        { id: 'teacher', icon: BookOpen, label: 'Teacher', color: 'bg-emerald-500' },
        { id: 'admin', icon: Lock, label: 'Admin', color: 'bg-purple-500' },
        { id: 'proctor', icon: Shield, label: 'Proctor', color: 'bg-orange-500' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-secondary/5 blur-3xl" />
            </div>

            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 p-6 items-center relative z-10 h-full md:h-auto overflow-y-auto md:overflow-visible">

                {/* Left Side: Branding & Role Selection */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col justify-center space-y-8 py-8 md:py-0"
                >
                    <div className="text-center md:text-left">
                        <div className="flex justify-center md:justify-start items-center gap-3 mb-4">
                            <motion.div
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                <Shield className="h-10 w-10 text-primary" />
                            </motion.div>
                            <span className="text-3xl font-bold text-primary-dark tracking-tight">SOEMS</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Select your role to access the secure examination portal.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {roles.map((item) => (
                            <motion.button
                                key={item.id}
                                onClick={() => handleRoleSelect(item.id as any)}
                                className={`relative group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 outline-none text-left ${role === item.id
                                    ? `border-${item.color.replace('bg-', '')} bg-white shadow-lg scale-[1.02] z-10`
                                    : 'border-transparent bg-white/60 hover:bg-white hover:scale-[1.01]'
                                    }`}
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {role === item.id && (
                                    <motion.div
                                        layoutId="active-ring"
                                        className={`absolute inset-0 rounded-xl border-2 ${item.color.replace('bg-', 'border-')}`}
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <div className={`p-3 rounded-lg ${role === item.id ? `${item.color} text-white` : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className={`block font-bold text-base ${role === item.id ? 'text-gray-900' : 'text-gray-600'
                                        }`}>
                                        {item.label}
                                    </span>
                                    <span className="text-xs text-gray-400">Click to login</span>
                                </div>

                                {role === item.id && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute right-4 text-primary"
                                    >
                                        <CheckCircle2 className={`h-5 w-5 ${item.color.replace('bg-', 'text-')}`} />
                                    </motion.div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Right Side: Login Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-xl p-8 shadow-2xl rounded-2xl border border-white/20"
                >
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className={`w-2 h-8 rounded-full ${roles.find(r => r.id === role)?.color}`}></span>
                            {roles.find(r => r.id === role)?.label} Login
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 ml-4">Please enter your credentials</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <Input
                            ref={emailInputRef}
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={`${role}@soems.edu`}
                            required
                            className="bg-gray-50/50"
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="bg-gray-50/50"
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                                <span className="ml-2 text-gray-600">Remember me</span>
                            </label>
                            <a href="#" className="font-medium text-primary hover:text-primary-dark">Forgot password?</a>
                        </div>

                        <Button
                            type="submit"
                            className="w-full relative overflow-hidden group py-3 text-lg"
                            size="lg"
                        >
                            <span className="relative z-10">Sign In</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        New to SOEMS?{' '}
                        <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                            Create an account
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
