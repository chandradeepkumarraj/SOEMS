import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { FiBarChart2, FiTrendingUp, FiZap } from 'react-icons/fi';
import { useEffect, useRef } from 'react';

const Counter = ({ value }: { value: number }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const spring = useSpring(0, { stiffness: 40, damping: 20 });
    const displayValue = useTransform(spring, (v) => Math.floor(v));

    useEffect(() => {
        if (isInView) {
            spring.set(value);
        }
    }, [isInView, value, spring]);

    return <motion.span ref={ref}>{displayValue}</motion.span>;
};

const AnalyticsSection = () => {
    // Generate a smooth spline path for the SVG graph
    const points = "20,180 80,140 140,160 200,80 260,120 320,60 380,40 440,90 500,30";

    return (
        <section id="analytics" className="py-32 px-4 bg-slate-950 relative overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#00A3E0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-block px-4 py-1.5 rounded-full bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            Deep Data Intelligence
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight">
                            Real-Time <span className="bg-clip-text bg-gradient-to-r from-cyber-purple to-cyber-pink">Operational Visibility</span>
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                            Transform examination metadata into actionable intelligence. Track participation flow and performance trends with sub-second latency.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        {[
                            {
                                icon: <FiBarChart2 size={24} />,
                                color: "bg-cyber-purple",
                                title: "Automated Score Distribution",
                                desc: "Instantly visualize Bell Curves and participation metrics. Monitor 'Finished', 'Active', and 'Not Attended' statuses in real-time."
                            },
                            {
                                icon: <FiZap size={24} />,
                                color: "bg-cyber-cyan",
                                title: "Adaptive Achievement Tracking",
                                desc: "Identify top-tier candidates with 'Quickest Win' tracking—identifying stars who solve complex problems with military precision."
                            },
                            {
                                icon: <FiTrendingUp size={24} />,
                                color: "bg-cyber-pink",
                                title: "Instant Grade Certification",
                                desc: "Automated results generation and certification distribution the moment the examination window closes. Zero manual intervention."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500">
                                <div className="flex gap-6 items-start">
                                    <div className={`p-4 rounded-2xl ${feature.color}/20 text-white shadow-lg shadow-${feature.color}/10 group-hover:scale-110 transition-transform`}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyber-cyan transition-colors">{feature.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        {/* High-Fidelity Chart UI */}
                        <div className="bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/10 p-10 shadow-2xl overflow-hidden group">
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Performance Matrix</h4>
                                    <div className="text-2xl font-black text-white">Institutional Pulse</div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <div className="px-3 py-1 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple font-black text-[10px] tracking-widest flex items-center gap-1.5 h-fit">
                                        <FiTrendingUp />
                                        +<Counter value={24} />%
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-cyber-purple" />
                                        <span className="text-[10px] font-bold text-slate-400">ACCURACY</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-cyber-cyan" />
                                        <span className="text-[10px] font-bold text-slate-400">PARTICIPATION</span>
                                    </div>
                                </div>
                            </div>

                            {/* SVG Spline Graph */}
                            <div className="relative h-64 mb-10">
                                <svg viewBox="0 0 520 200" className="w-full h-full overflow-visible">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    {[0, 50, 100, 150, 200].map((y) => (
                                        <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                                    ))}

                                    {/* Area under the curve */}
                                    <motion.path
                                        d={`M20,200 L${points} L500,200 Z`}
                                        fill="url(#chartGradient)"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 1.5 }}
                                    />

                                    {/* Main Spline Path */}
                                    <motion.path
                                        d={`M${points}`}
                                        fill="none"
                                        stroke="#7c3aed"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                    />

                                    {/* Data Points */}
                                    {points.split(' ').map((p, i) => {
                                        const [x, y] = p.split(',').map(Number);
                                        return (
                                            <motion.circle
                                                key={i}
                                                cx={x}
                                                cy={y}
                                                r="4"
                                                fill="#0a0e27"
                                                stroke="#7c3aed"
                                                strokeWidth="2"
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                                transition={{ delay: 1 + i * 0.1 }}
                                            />
                                        );
                                    })}
                                </svg>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/stat">
                                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest group-hover/stat:text-cyber-purple transition-colors">Avg Accuracy</div>
                                    <div className="text-3xl font-black text-white italic tracking-tighter">
                                        <Counter value={84} />.2%
                                    </div>
                                    <div className="text-[10px] text-cyber-green font-black mt-1 uppercase tracking-widest">↑ 4.2%_PREV</div>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/stat">
                                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest group-hover/stat:text-cyber-cyan transition-colors">Participation</div>
                                    <div className="text-3xl font-black text-cyber-cyan italic tracking-tighter">
                                        <Counter value={99} />.9%
                                    </div>
                                    <div className="text-[10px] text-cyber-cyan font-black mt-1 uppercase tracking-widest">GRID_CAPACITY_MAX</div>
                                </div>
                            </div>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyber-purple/10 rounded-full blur-[120px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AnalyticsSection;
