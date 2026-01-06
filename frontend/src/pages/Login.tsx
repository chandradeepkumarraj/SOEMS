import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    Shield, GraduationCap, BookOpen, Lock,
    Activity, ArrowRight, Loader2, Eye, EyeOff,
    ChevronLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login, getCurrentUser } from '../services/authService';
import { loginSchema, LoginFormValues } from '../utils/authSchema';
import ParticleSystem from '../components/landing/ParticleSystem';

export default function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | 'proctor'>('student');
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/dashboard');
        }
    }, [navigate]);

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setServerError('');
        try {
            const userData = await login({ email: data.email, password: data.password });
            if (userData.role === 'admin') navigate('/admin/dashboard');
            else if (userData.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/dashboard');
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const roles = [
        {
            id: 'student',
            icon: GraduationCap,
            label: 'Student',
            color: 'text-cyber-cyan',
            iconColor: '#00ccff',
            bg: 'bg-cyber-cyan/10',
            shadow: 'shadow-glow-cyan',
            gradient: 'from-cyber-cyan to-cyber-blue',
            placeholder: 'student@soems.edu'
        },
        {
            id: 'teacher',
            icon: BookOpen,
            label: 'Teacher',
            color: 'text-cyber-green',
            iconColor: '#00ffaa',
            bg: 'bg-cyber-green/10',
            shadow: 'shadow-glow-green',
            gradient: 'from-cyber-green to-emerald-500',
            placeholder: 'faculty@soems.edu'
        },
        {
            id: 'admin',
            icon: Lock,
            label: 'Admin',
            color: 'text-cyber-purple',
            iconColor: '#aa00ff',
            bg: 'bg-cyber-purple/10',
            shadow: 'shadow-glow-purple',
            gradient: 'from-cyber-purple to-cyber-pink',
            placeholder: 'admin@soems.protocol'
        },
        {
            id: 'proctor',
            icon: Shield,
            label: 'Proctor',
            color: 'text-cyber-pink',
            iconColor: '#ff0066',
            bg: 'bg-cyber-pink/10',
            shadow: 'shadow-glow-pink',
            gradient: 'from-cyber-pink to-rose-500',
            placeholder: 'auditor@soems.io'
        },
    ];

    const currentRoleData = roles.find(r => r.id === role) || roles[0];

    return (
        <div id="auth-root" className="h-screen bg-cyber-dark flex flex-col lg:flex-row relative overflow-hidden font-['Outfit'] selection:bg-cyber-cyan/30 selection:text-white">
            <ParticleSystem />

            {/* Top-Left Exit Strategy */}
            <div className="absolute top-8 left-8 z-50">
                <Link to="/" className="inline-flex items-center gap-3 text-white hover:text-cyber-cyan transition-all font-black text-[11px] uppercase tracking-[0.4em] group bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl border border-white/10 hover:border-cyber-cyan/30 shadow-2xl backdrop-blur-md">
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform text-cyber-cyan" />
                    Back to Home
                </Link>
            </div>

            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyber-cyan/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyber-purple/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />

            {/* Left Section: Branding & Protocol Info */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden lg:flex lg:w-[40%] xl:w-[45%] flex-col justify-center px-16 xl:px-24 z-10 relative overflow-hidden border-r border-white/5"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/5 via-transparent to-cyber-purple/5 opacity-30" />

                <Link to="/" className="inline-flex items-center gap-4 mb-12 group">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyber-cyan to-cyber-blue rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-glow-cyan group-hover:scale-110 transition-transform">

                    </div>
                    <div>
                        <span className="text-4xl font-black bg-gradient-to-r from-cyber-cyan to-cyber-blue bg-clip-text block tracking-tighter">
                            SOEMS
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Node</span>
                    </div>
                </Link>

                <div className="space-y-8">
                    <h1 className="text-6xl xl:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
                        The Future <br />
                        <span className="text-cyber-cyan">of Integrity.</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-sm leading-relaxed font-medium">
                        Access the most advanced examination management environment with high-fidelity proctoring and real-time intelligence.
                    </p>

                    <div className="pt-8 space-y-4">
                        {[
                            { label: 'Neural Surveillance', icon: Activity },
                            { label: 'Cloud Distribution', icon: BookOpen },
                            { label: 'Zero-Trust Protocol', icon: Lock }
                        ].map((f, i) => (
                            <motion.div
                                key={f.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-center gap-4 group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyber-cyan group-hover:bg-cyber-cyan/10 transition-all">
                                    <f.icon className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300">
                                    {f.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </motion.div>

            {/* Right Section: Sliding Form Area */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-20 overflow-y-auto lg:overflow-hidden">
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-full max-w-xl"
                >
                    {/* Main Auth Card with Neon Aura */}
                    <div className="neon-aura-container shadow-2xl group">
                        <div className="neon-aura-content bg-slate-900/60 backdrop-blur-3xl p-10 lg:p-14 relative overflow-hidden">
                            <div className="scan-line" />
                            {/* Dynamic top-edge glow */}
                            <motion.div
                                layoutId="form-glow"
                                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${currentRoleData.id === 'student' ? 'cyber-cyan' : currentRoleData.id === 'teacher' ? 'cyber-green' : currentRoleData.id === 'admin' ? 'cyber-purple' : 'cyber-pink'} to-transparent opacity-50 transition-colors duration-500`}
                            />

                            <div className="text-center mb-10 lg:hidden">
                                <span className="text-3xl font-black bg-gradient-to-r from-cyber-cyan to-cyber-blue bg-clip-text">SOEMS</span>
                            </div>

                            <div className="mb-10">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">Sign In</h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Accessing Protocol for <span className={currentRoleData.color}>{currentRoleData.label}</span> Account</p>
                            </div>

                            {/* Role Selectors */}
                            <div className="grid grid-cols-4 gap-4 mb-10">
                                {roles.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id as any)}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-[2.5rem] transition-all relative group/role active:scale-95 ${role === r.id
                                            ? `bg-white/[0.08] shadow-2xl ring-1 ring-white/20 scale-105`
                                            : 'hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <div
                                            className={`p-4 rounded-2xl transition-all duration-500 shadow-lg ${role === r.id ? `bg-gradient-to-br ${r.gradient} text-white ${r.shadow}` : 'bg-white/5'} flex items-center justify-center`}
                                            style={role !== r.id ? { color: r.iconColor + '88' } : {}}
                                        >
                                            <r.icon className="h-6 w-6" />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${role === r.id ? r.color : 'text-slate-500 group-hover/role:text-slate-300'}`}>
                                            {r.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                <AnimatePresence mode="wait">
                                    {serverError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-3"
                                        >
                                            <Activity className="h-4 w-4 animate-pulse" />
                                            {serverError}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Email Terminal</label>
                                        <div className="group relative">
                                            <Input
                                                {...register('email')}
                                                type="email"
                                                placeholder={currentRoleData.placeholder}
                                                className={`h-16 bg-white/[0.03] border-white/10 rounded-[2rem] focus:ring-2 focus:ring-cyber-cyan/20 px-8 font-semibold text-white transition-all ${errors.email ? 'ring-2 ring-red-500/50' : ''}`}
                                            />
                                            {errors.email && <span className="text-[10px] text-red-400 font-bold ml-4 uppercase tracking-wider">{errors.email.message}</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Security Pass</label>
                                            {role === 'admin' && (
                                                <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-cyber-purple hover:text-white transition-all underline underline-offset-4 decoration-cyber-purple/30">Recover</Link>
                                            )}
                                        </div>
                                        <div className="group relative">
                                            <Input
                                                {...register('password')}
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="ACCESS_KEY_PROTOCOL"
                                                className={`h-16 bg-white/[0.03] border-white/10 rounded-[2rem] focus:ring-2 focus:ring-${currentRoleData.id === 'student' ? 'cyber-cyan' : currentRoleData.id === 'teacher' ? 'cyber-green' : currentRoleData.id === 'admin' ? 'cyber-purple' : 'cyber-pink'}/20 px-8 font-semibold text-white transition-all ${errors.password ? 'ring-2 ring-red-500/50' : ''}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyber-cyan transition-all p-4 hover:bg-white/5 rounded-full"
                                            >
                                                {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                            </button>
                                        </div>
                                        {errors.password && <span className="text-[10px] text-red-400 font-bold ml-4 uppercase tracking-wider">{errors.password.message}</span>}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-18 rounded-[2rem] bg-gradient-to-r ${currentRoleData.gradient} ${currentRoleData.shadow} text-white font-black text-lg tracking-[0.1em] transition-all active:scale-[0.98] group relative overflow-hidden flex items-center justify-center gap-3`}
                                >
                                    <div className="relative flex items-center gap-3">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                SYNCING...
                                            </>
                                        ) : (
                                            <>
                                                ESTABLISH SESSION
                                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                </Button>
                            </form>

                        </div>
                    </div>

                    <div className="mt-8 text-center text-slate-600">
                        <p className="text-[9px] font-black uppercase tracking-[0.5em]">
                            Validated Secure | SOEMS_V2.4.0
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
