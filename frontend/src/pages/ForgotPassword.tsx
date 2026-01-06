import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, ArrowRight, Loader2, ChevronLeft, Activity, Lock, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ParticleSystem from '../components/landing/ParticleSystem';

const resetSchema = z.object({
    email: z.string().email('Invalid email address'),
    answers: z.array(z.string().min(1, 'Answer is required')).length(3),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6)
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            answers: ['', '', '']
        }
    });

    const onSubmit = async (data: ResetFormValues) => {
        setIsLoading(true);
        setServerError('');
        try {
            await axios.post('/api/auth/reset-admin-password', {
                email: data.email,
                answers: data.answers,
                newPassword: data.newPassword
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Verification failed. Please check your answers.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div id="auth-root" className="min-h-screen bg-cyber-dark flex items-center justify-center p-4 relative overflow-hidden">
                <ParticleSystem />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-900/60 backdrop-blur-3xl p-12 rounded-[3rem] text-center border border-white/10 shadow-2xl relative z-10"
                >
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-cyber-green/10 rounded-full shadow-glow-green">
                            <CheckCircle2 className="h-12 w-12 text-cyber-green" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Access Restored</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Your key has been re-authorized. <br />Returning to node...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div id="auth-root" className="min-h-screen bg-cyber-dark transition-colors duration-500 flex items-center justify-center p-4 relative overflow-hidden selection:bg-cyber-purple/30 selection:text-white">
            <ParticleSystem />

            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyber-purple/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyber-blue/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />

            <div className="absolute top-12 left-12 z-20 hidden lg:block">
                <Link to="/login" className="inline-flex items-center gap-3 text-white hover:text-cyber-purple transition-all font-black text-[11px] uppercase tracking-[0.4em] group bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl border border-white/10 hover:border-cyber-purple/30 shadow-2xl backdrop-blur-md">
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform text-cyber-purple" />
                    Back to Terminal
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg z-10"
            >
                <div className="text-center mb-8 lg:hidden">
                    <Link to="/login" className="inline-flex items-center gap-2 text-cyber-purple hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.3em]">
                        <ChevronLeft className="h-4 w-4" /> Back to Authorization
                    </Link>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 border border-white/10 relative shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-purple to-transparent opacity-50" />

                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <div className="p-5 rounded-[2rem] bg-cyber-purple/10 border border-cyber-purple/20 shadow-glow-purple group-hover:scale-110 transition-transform duration-500">
                                <Lock className="h-10 w-10 text-cyber-purple" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Recover <span className="text-cyber-purple">Admin</span> Key</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Identity Authorization Required</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {serverError && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3"
                                >
                                    <Activity className="h-4 w-4 animate-pulse" />
                                    {serverError}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 ml-2">Admin Email</label>
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="admin@soems.edu"
                                    className={`h-14 bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-500 rounded-2xl focus:ring-purple-500 px-6 font-bold text-slate-900 dark:text-white ${errors.email ? 'ring-2 ring-red-500/50' : ''}`}
                                />
                                {errors.email && <span className="text-[10px] text-red-600 dark:text-red-400 font-bold ml-2 uppercase">{errors.email.message}</span>}
                            </div>

                            <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                                    <Shield className="h-3 w-3" /> Identity Verification Questions
                                </p>

                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="mb-4 space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Verification Token {i + 1}</label>
                                        <Input
                                            {...register(`answers.${i}`)}
                                            placeholder={`_TOKEN_SEQ_00${i + 1}`}
                                            className={`h-14 bg-white/[0.03] border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-cyber-purple/20 px-8 font-semibold text-white transition-all ${errors.answers?.[i] ? 'ring-2 ring-red-500/50' : ''}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 space-y-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">New Access Key</label>
                                    <Input
                                        {...register('newPassword')}
                                        type="password"
                                        placeholder="_NEW_SEQ_AUTH"
                                        className={`h-14 bg-white/[0.03] border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-cyber-purple/20 px-8 font-semibold text-white transition-all ${errors.newPassword ? 'ring-2 ring-red-500/50' : ''}`}
                                    />
                                    {errors.newPassword && <span className="text-[10px] text-red-400 font-bold ml-4 uppercase">{errors.newPassword.message}</span>}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Confirm New Key</label>
                                    <Input
                                        {...register('confirmPassword')}
                                        type="password"
                                        placeholder="_CONFIRM_SEQ_AUTH"
                                        className={`h-14 bg-white/[0.03] border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-cyber-purple/20 px-8 font-semibold text-white transition-all ${errors.confirmPassword ? 'ring-2 ring-red-500/50' : ''}`}
                                    />
                                    {errors.confirmPassword && <span className="text-[10px] text-red-400 font-bold ml-4 uppercase">{errors.confirmPassword.message}</span>}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-18 rounded-[2rem] bg-gradient-to-r from-cyber-purple to-cyber-pink shadow-glow-purple text-white font-black text-lg tracking-[0.1em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <div className="relative flex items-center gap-3">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        VERIFYING...
                                    </>
                                ) : (
                                    <>
                                        RE-AUTHORIZE KEY
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
