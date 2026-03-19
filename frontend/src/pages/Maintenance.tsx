import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ShieldCheck, Mail, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-12 text-center relative z-10"
            >
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-primary/10 rounded-full blur-xl"
                        />
                        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center relative">
                            <RefreshCw className="h-10 w-10 text-primary animate-spin-slow" />
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
                    Maintenance <span className="text-primary italic">Protocol</span>
                </h1>
                
                <div className="flex items-center justify-center gap-2 mb-8">
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" /> System Restricted
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Estimated uptime: Soon
                    </span>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed mb-10 max-w-md mx-auto">
                    SOEMS is currently undergoing scheduled infrastructure upgrades to enhance your scholarly experience. We'll be back online momentarily.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-4 text-left group transition-all hover:border-primary/30">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Data Integrity</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">All systems secure</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-4 text-left group transition-all hover:border-primary/30">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                            <Mail className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Need Support?</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Contact Admin</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button 
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs h-auto"
                    >
                        Check System Status
                    </Button>
                    <Button 
                        variant="secondary"
                        onClick={() => window.location.href = '/login'}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs h-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-none"
                    >
                        Administrator Bypass
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default Maintenance;
