
import { motion } from 'framer-motion';
import { FiCpu, FiShield, FiStar, FiWifiOff } from 'react-icons/fi';

const stories = [
    {
        icon: <FiCpu className="text-cyber-cyan" />,
        title: "Adaptive Precision (C.A.T.)",
        subtitle: "Story 1: The Rise of C.A.T.",
        description: "Implementing GRE-standard staircase algorithms for dynamic difficulty adjustment in real-time.",
        points: ["Staircase Algorithm", "Zero-Latency Delivery", "State Preservation"],
        color: "from-cyber-cyan/20 to-cyber-blue/10"
    },
    {
        icon: <FiShield className="text-cyber-purple" />,
        title: "Behavioral Integrity (HEI)",
        subtitle: "Story 2: The Trust Protocol",
        description: "Semantic analysis of telemetry data to generate an Honesty & Exam Integrity Index score.",
        points: ["Telemetry Analysis", "Qualitative Summaries", "Radial Heatmaps"],
        color: "from-cyber-purple/20 to-cyber-pink/10"
    },
    {
        icon: <FiStar className="text-cyber-green" />,
        title: "Recognition Ecosystem",
        subtitle: "Story 3: Professional Gamification",
        description: "Rewarding excellence with skills-based digital badges, ready for social export to LinkedIn & X.",
        points: ["Academic Titan Badge", "Integrity Shield", "Social Sharing (OG)"],
        color: "from-cyber-green/20 to-cyber-blue/10"
    },
    {
        icon: <FiWifiOff className="text-cyber-blue" />,
        title: "Resilient Offline Sync",
        subtitle: "Story 4: Zero Failure Connectivity",
        description: "Enhanced LocalStorage buffering (Offline Sync 2.0) ensures progress parity during network flux.",
        points: ["Buffer Handshaking", "Conflict Resolution", "Momentary Sync"],
        color: "from-cyber-blue/20 to-cyber-cyan/10"
    }
];

const EvolutionSection = () => {
    return (
        <section id="evolution" className="py-32 px-4 bg-slate-950 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-cyber-cyan/5 rounded-full blur-[150px]" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyber-purple/5 rounded-full blur-[150px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-block px-4 py-1.5 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                            Project Evolution: Q1 2026
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                            SYSTEM <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-blue">TRANSFORMATION</span>
                        </h2>
                        <p className="max-w-3xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                            Chronicles of our journey from core architecture to cutting-edge adaptive intelligence.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {stories.map((story, i) => (
                        <motion.div
                            key={i}
                            className={`p-1 hidden md:block rounded-[3rem] bg-gradient-to-br ${story.color} border border-white/5 group relative overflow-hidden`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2.8rem] p-10 h-full flex flex-col items-start transition-all hover:bg-slate-900/40">
                                <div className="p-5 rounded-2xl bg-white/5 mb-8 group-hover:scale-110 transition-transform shadow-glow-cyan/20 group-hover:shadow-glow-cyan">
                                    {story.icon}
                                </div>
                                <div className="text-[10px] font-black text-cyber-cyan uppercase tracking-[0.4em] mb-2">{story.subtitle}</div>
                                <h3 className="text-3xl font-black text-white mb-6 group-hover:text-cyber-cyan transition-colors">{story.title}</h3>
                                <p className="text-slate-400 text-base leading-relaxed mb-10 font-medium">
                                    {story.description}
                                </p>
                                
                                <div className="mt-auto flex flex-wrap gap-2">
                                    {story.points.map((p, idx) => (
                                        <span key={idx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400 group-hover:text-white transition-colors">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Mobile version for all stories */}
                    <div className="md:hidden space-y-6">
                         {stories.map((story, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-900 border border-white/10">
                                <h3 className="text-2xl font-black text-white mb-2">{story.title}</h3>
                                <p className="text-slate-400 text-sm mb-4">{story.description}</p>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EvolutionSection;
