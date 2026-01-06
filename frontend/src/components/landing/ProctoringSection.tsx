import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { FiShield, FiActivity, FiLock, FiTerminal } from 'react-icons/fi';
import { useEffect, useRef } from 'react';

const Counter = ({ value }: { value: number }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const spring = useSpring(0, { stiffness: 40, damping: 20 });
    const displayValue = useTransform(spring, (v) => Math.floor(v));

    useEffect(() => {
        if (isInView) spring.set(value);
    }, [isInView, value, spring]);

    return <motion.span ref={ref}>{displayValue}</motion.span>;
};

const ProctoringSection = () => {
    const features = [
        {
            title: "Proctor Command Console",
            description: "A high-telemetry environment providing live incident streams and automated compliance enforcement. Monitor a single hall or a global campus with total precision.",
            icon: <FiShield className="text-cyber-cyan" />,
            points: ["Live Incident Stream", "Proctor Overrule", "Global Scope Toggle"]
        },
        {
            title: "Deep Diagnostic Intelligence",
            description: "Go beyond scoring. Automated analysis identifies toughest questions through accuracy heatmaps and session duration benchmarks.",
            icon: <FiActivity className="text-cyber-purple" />,
            points: ["Integrity Scoring", "Question Forensics", "Speed Benchmarking"]
        },
        {
            title: "Military-Grade Audit Trails",
            description: "Build unassailable trust. Every action, violation, and administrative overrule is logged into a permanent, non-repudiable repository.",
            icon: <FiLock className="text-cyber-pink" />,
            points: ["Forensic CSV Reports", "Permanent Repositories", "Live System Sync"]
        }
    ];

    return (
        <section id="proctoring" className="py-32 px-4 bg-cyber-dark relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyber-purple/5 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyber-cyan/5 rounded-full blur-[150px] animate-pulse" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-20 mb-24">
                    <motion.div
                        className="lg:w-1/2"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                            </span>
                            Surveillance System Active
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight">
                            Command Total <br />
                            <span className="bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-blue italic">Examination Integrity</span>
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-xl">
                            Our proprietary engine leverages real-time telemetry to neutralize academic dishonesty before it impacts institutional standards.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                            {[
                                { text: <><Counter value={92} />.4% Anomaly Accuracy</>, icon: <FiShield /> },
                                { text: 'Zero-Latency Feedback', icon: <FiTerminal /> },
                                { text: 'Auto Suspension Engine', icon: <FiLock /> },
                                { text: 'Global Telemetry Sync', icon: <FiActivity /> }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-slate-300 font-bold group">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-cyber-cyan group-hover:bg-cyber-cyan/10 group-hover:text-cyber-cyan transition-all">
                                        {item.icon}
                                    </div>
                                    <span className="text-sm group-hover:translate-x-1 transition-transform">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:w-1/2 relative w-full"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        {/* High-Fidelity Proctor Console UI */}
                        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[0_0_8px_rgba(255,95,86,0.3)]" />
                                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[0_0_8px_rgba(255,189,46,0.3)]" />
                                    <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[0_0_8px_rgba(39,201,63,0.3)]" />
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 tracking-[0.3em] font-bold">SOEMS_SYSTEM_CORE_v4.0.2</div>
                            </div>

                            <div className="space-y-3 relative z-10 max-h-[320px] overflow-hidden">
                                <div className="scan-line !opacity-10" />
                                {[
                                    { user: 'USR_88201', action: 'TAB_VIOLATION', color: 'text-red-400', time: '12:04:12', bg: 'bg-red-500/5' },
                                    { user: 'USR_12944', action: 'PERIPHERAL_SYNC', color: 'text-amber-400', time: '12:04:15', bg: 'bg-amber-500/5' },
                                    { user: 'USR_44590', action: 'SESSION_VERIFIED', color: 'text-cyber-cyan', time: '12:04:18', bg: 'bg-cyber-cyan/5' },
                                    { user: 'USR_09211', action: 'TERMINAL_LOCK', color: 'text-white', time: '12:04:22', bg: 'bg-slate-500/5' },
                                    { user: 'USR_77210', action: 'UPLINK_STABLE', color: 'text-cyber-green', time: '12:04:25', bg: 'bg-cyber-green/5' }
                                ].map((log, i) => (
                                    <motion.div
                                        key={i}
                                        className={`flex justify-between items-center p-4 rounded-xl ${log.bg} border border-white/5 font-mono text-[10px] group-hover:border-white/10 transition-all`}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className={`h-1.5 w-1.5 rounded-full ${log.color.replace('text-', 'bg-')} animate-pulse`} />
                                            <span className="text-slate-500">[{log.time}]</span>
                                            <span className="text-white font-bold tracking-widest">{log.user}</span>
                                        </div>
                                        <span className={`${log.color} font-black tracking-widest uppercase italic`}>{log.action}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyber-cyan/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-[2s]" />
                        </div>

                        {/* Floating Status Card */}
                        <motion.div
                            className="absolute -bottom-10 -left-10 p-6 rounded-3xl bg-[#0a0e27]/90 backdrop-blur-xl border border-white/10 shadow-2xl hidden md:block min-w-[240px]"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Network Pulse</div>
                                <div className="flex items-center gap-1.5 font-mono text-[9px] text-cyber-cyan bg-cyber-cyan/10 px-2 py-0.5 rounded-full border border-cyber-cyan/20">
                                    <div className="h-1 w-1 rounded-full bg-cyber-cyan animate-pulse" />
                                    LIVE
                                </div>
                            </div>

                            <div className="h-16 relative overflow-hidden mb-4 bg-slate-900/50 rounded-xl border border-white/5">
                                <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="transparent" />
                                            <stop offset="50%" stopColor="#00A3E0" />
                                            <stop offset="100%" stopColor="transparent" />
                                        </linearGradient>
                                    </defs>
                                    {/* Background static wave */}
                                    <path
                                        d="M0,30 Q25,10 50,30 T100,30 T150,30 T200,30"
                                        fill="none"
                                        stroke="rgba(0,163,224,0.1)"
                                        strokeWidth="1"
                                    />
                                    {/* Animated pulse wave */}
                                    <motion.path
                                        d="M0,30 Q25,10 50,30 T100,30 T150,30 T200,30"
                                        fill="none"
                                        stroke="url(#pulseGradient)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        animate={{
                                            x: [-200, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    />
                                    <motion.path
                                        d="M0,30 Q25,30 50,30 T100,30 T150,30 T200,30"
                                        fill="none"
                                        stroke="#00A3E0"
                                        strokeWidth="1"
                                        strokeOpacity="0.2"
                                    />
                                </svg>
                                {/* Center Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-cyan/5 to-transparent pointer-events-none" />
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">LATENCY_CORE</div>
                                    <div className="text-xl font-black text-white italic tracking-tighter">0.<Counter value={2} />ms</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">NODES_SYNC</div>
                                    <div className="text-lg font-black text-cyber-cyan italic tracking-tighter"><Counter value={99} />.9%</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-cyber-cyan/30 hover:bg-white/[0.04] transition-all duration-500 group"
                            whileHover={{ y: -10 }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl group-hover:shadow-cyber-cyan/10">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyber-cyan transition-colors">{feature.title}</h3>
                            <p className="text-slate-500 text-base leading-relaxed mb-8">
                                {feature.description}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                                {feature.points.map((p, i) => (
                                    <span key={i} className="text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-400 group-hover:text-cyber-cyan group-hover:bg-cyber-cyan/10 transition-all">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProctoringSection;
