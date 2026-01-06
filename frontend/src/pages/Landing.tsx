import { useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import {
    ArrowRight, Shield, Cpu, Zap, Lock, Users,
    Activity, Sun, Moon, BarChart3,
    Eye, Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
    const { theme, toggleTheme } = useTheme();
    const heroRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x, y });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
            {/* Theme Toggle & Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">SOEMS</span>
                        </div>

                        <div className="hidden md:flex items-center gap-10 text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                            <a href="#features" className="hover:text-primary transition-colors">Strategic Features</a>
                            <a href="#intelligence" className="hover:text-primary transition-colors">Core Intelligence</a>
                            <a href="#access" className="hover:text-primary transition-colors">Access Portal</a>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
                            </button>
                            <Link to="/login">
                                <Button variant="ghost" className="hidden sm:flex text-slate-900 dark:text-slate-100 font-black uppercase tracking-widest text-[10px]">Sign In</Button>
                            </Link>
                            <Link to="/login">
                                <Button className="bg-primary hover:bg-primary-dark text-white rounded-full px-6 shadow-xl shadow-primary/20">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {/* 3D Hero Section */}
                <section
                    ref={heroRef}
                    onMouseMove={handleMouseMove}
                    className="relative pt-48 pb-32 px-4 flex flex-col items-center justify-center text-center overflow-hidden"
                >
                    {/* Background Parallax Elements */}
                    <motion.div
                        className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"
                        animate={{
                            x: mousePosition.x * 50,
                            y: mousePosition.y * 50,
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 -right-12 w-64 h-64 bg-accent/10 rounded-full blur-[100px]"
                        animate={{
                            x: mousePosition.x * -50,
                            y: mousePosition.y * -50,
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 perspective-1000"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em] mb-8">
                            <Zap className="h-3 w-3 fill-primary" />
                            Next-Gen protocol
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 text-slate-900 dark:text-white">
                            SECURE <br />
                            <span className="text-gradient">INTELLIGENCE</span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-slate-900 dark:text-slate-100 text-lg md:text-xl font-bold leading-relaxed mb-12">
                            The definitive environment for high-stakes academic integrity, powered by real-time behavioral analytics.
                            Engineered for <span className="text-primary font-bold">maximum focus</span> and
                            <span className="text-accent font-bold"> zero compromise</span> security.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link to="/login">
                                <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary-dark text-white text-lg font-black shadow-2xl shadow-primary/20 group">
                                    ESTABLISH SESSION
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest shadow-xl">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-slate-200 dark:bg-slate-800" />)}
                                </div>
                                2.4k+ Active Users
                            </div>
                        </div>
                    </motion.div>

                    {/* 3D Visual Hub Mockup */}
                    <motion.div
                        className="mt-20 relative w-full max-w-5xl aspect-video glass-card rounded-3xl p-4 overflow-hidden shadow-2xl preserve-3d"
                        style={{
                            rotateX: mousePosition.y * -15,
                            rotateY: mousePosition.x * 15,
                        }}
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <div className="h-full w-full rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                            <div className="absolute top-6 left-6 flex gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                <div className="h-3 w-3 rounded-full bg-green-400" />
                            </div>
                            <Cpu className="h-24 w-24 text-primary/20 animate-pulse" />
                            <div className="absolute bottom-6 right-6 font-mono text-[10px] text-slate-900 dark:text-white font-black">CONSOLE_READY: PORT_8080</div>
                        </div>
                    </motion.div>
                </section>

                {/* Insight: Management & Monitoring */}
                <section id="features" className="py-32 bg-white dark:bg-slate-900 transition-colors">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <div className="text-primary font-black uppercase tracking-widest text-sm mb-4">Command Center</div>
                                <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight dark:text-white">CENTRALIZED <br /> MANAGEMENT</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed">
                                    A multi-role hierarchy allows administrators to govern the entire ecosystem while teachers focus on pedagogy. Batch user management with zero-latency synchronization.
                                </p>

                                <div className="space-y-6">
                                    <InsightItem
                                        icon={Users}
                                        title="Hierarchical Orchestration"
                                        desc="Granular permissions for Admins, Teachers, and Proctors."
                                    />
                                    <InsightItem
                                        icon={Server}
                                        title="Infrastructure Resilience"
                                        desc="Auto-sync protocols ensure no data loss during network flux."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-6 pt-12">
                                    <StatCard title="Active Exams" value="128" icon={Activity} color="text-blue-500" />
                                    <StatCard title="Throughput" value="12mb/s" icon={Zap} color="text-yellow-500" />
                                </div>
                                <div className="space-y-6">
                                    <StatCard title="Security Score" value="A+" icon={Shield} color="text-green-500" />
                                    <StatCard title="Cloud Health" value="100%" icon={Server} color="text-purple-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Insight: Security & Proctoring */}
                <section id="security" className="py-32 bg-slate-50 dark:bg-slate-950 transition-colors">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <div className="max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-6xl font-black mb-6 dark:text-white">ELITE PROCTORING</h2>
                            <p className="text-slate-900 dark:text-slate-100 text-lg mb-10 leading-relaxed font-bold">
                                Every interaction is cataloged. Every deviation is analyzed. A scholarly fortress built with industrial precision.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <SecurityFeature
                                icon={Eye}
                                title="Visual Fidelity"
                                desc="Eye-tracking and presence detection with millisecond refresh rates."
                            />
                            <SecurityFeature
                                icon={Lock}
                                title="Protocol Lock"
                                desc="Total environment isolation. Prevents unauthorized tab switching or external input."
                            />
                            <SecurityFeature
                                icon={BarChart3}
                                title="Anomaly Analytics"
                                desc="Real-time suspicion scoring based on behavioral patterns."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-40 px-4 relative overflow-hidden bg-primary">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-10 leading-tight">THE FUTURE IS <br /> AUTHORIZED.</h2>
                        <p className="text-xl text-primary-light font-bold mb-12 max-w-xl mx-auto opacity-80">
                            Join elite institutions redefining digital assessment. Experience the SOEMS difference today.
                        </p>
                        <Link to="/login">
                            <Button size="lg" className="h-20 px-12 rounded-2xl bg-white text-primary hover:bg-slate-100 font-black text-2xl shadow-2xl">
                                INITIATE DEPLOYMENT
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="py-20 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">SOEMS</span>
                    </div>
                    <div className="flex gap-10 text-sm font-bold text-slate-500 uppercase tracking-widest">
                        <a href="#" className="hover:text-primary">Docs</a>
                        <a href="#" className="hover:text-primary">Legal</a>
                        <a href="#" className="hover:text-primary">Privacy</a>
                    </div>
                    <div className="text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-[0.2em]">© 2026 SOEMS ANALYTICS ENGINE.</div>
                </div>
            </footer>
        </div>
    );
}

function InsightItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-6 items-start">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-1 dark:text-white">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{desc}</p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-transform hover:-translate-y-2 group">
            <div className={`p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon className={`h-8 w-8 ${color}`} />
            </div>
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</div>
            <div className="text-3xl font-black dark:text-white">{value}</div>
        </div>
    );
}

function SecurityFeature({ icon: Icon, title, desc }: any) {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all text-left group"
        >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                <Icon className="h-8 w-8 text-primary group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black mb-4 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
        </motion.div>
    );
}
