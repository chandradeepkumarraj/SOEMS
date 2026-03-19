
import { motion } from 'framer-motion';
import { FiCpu, FiShield, FiGlobe, FiLayers, FiDatabase, FiSettings, FiAward, FiTerminal } from 'react-icons/fi';

const insightCategories = [
    {
        title: "Adaptive Core",
        icon: <FiCpu className="text-cyber-cyan" />,
        features: [
            "2-Up / 1-Down Staircase Algorithm",
            "Real-time Difficulty Scaling",
            "Pre-generation Pipeline logic",
            "Dynamic Tiered Question Pools"
        ]
    },
    {
        title: "Proctoring Intelligence",
        icon: <FiShield className="text-cyber-purple" />,
        features: [
            "Honesty & Integrity (HEI) Indexing",
            "250ms Debounced Mouse-Exit Logic",
            "Semantic Violation Summaries",
            "Radial Behavioral Mapping"
        ]
    },
    {
        title: "Infrastructure",
        icon: <FiGlobe className="text-cyber-green" />,
        features: [
            "Socket.io Polling Fallback Nodes",
            "PWA Workbox Resilience",
            "Vite Host Exposure Protocols",
            "Zero-Latency State Recovery"
        ]
    },
    {
        title: "Resilience Engine",
        icon: <FiLayers className="text-cyber-blue" />,
        features: [
            "Offline Sync 2.0 (Local Buffer)",
            "Momentary Handshake Checks",
            "Conflict Resolution Logic",
            "Persistent State Snapshots"
        ]
    },
    {
        title: "Content AI",
        icon: <FiTerminal className="text-cyber-pink" />,
        features: [
            "Semantic Distractor Generation",
            "Subjective 'Concept Gap' Engine",
            "Batch Authoring Micro-services",
            "Remediation Roadmap Plotting"
        ]
    },
    {
        title: "Recognition",
        icon: <FiAward className="text-cyber-cyan" />,
        features: [
            "Digital Badge Library (v1.2)",
            "OG-Standard Social Metadata",
            "Professional Milestone Tracking",
            "LinkedIn Credential Export"
        ]
    },
    {
        title: "Security Layers",
        icon: <FiDatabase className="text-cyber-yellow" />,
        features: [
            "JWT Token Expiry Synchronizer",
            "CORS Isolation Protocols",
            "MongoDB Aggregation Pipelines",
            "Discriminator Model Scaling"
        ]
    },
    {
        title: "Advanced Logic",
        icon: <FiSettings className="text-cyber-blue" />,
        features: [
            "Department-Proctor Mapping",
            "Hierarchical Room Guards",
            "Auto-Allocation Algorithms",
            "Fuzzy Kill-Switch Controls"
        ]
    }
];

const DeepInsightsSection = () => {
    return (
        <section id="insights" className="py-32 px-4 bg-cyber-dark relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyber-cyan/3 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyber-purple/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <motion.div
                        className="max-w-2xl"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                            THE <span className="text-cyber-cyan italic">GRANULAR</span> <br />
                            ENGINEERING STACK
                        </h2>
                        <p className="text-slate-400 font-medium text-lg">
                            An exhaustive look at the microscopic features that power the SOEMS ecosystem. We developed every logic gate and behavioral trigger to ensure unmatched precision.
                        </p>
                    </motion.div>
                    <motion.div
                        className="hidden md:block text-right"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="text-5xl font-black text-white/5 tracking-tighter uppercase italic">Institutional</div>
                        <div className="text-3xl font-black text-cyber-cyan italic tracking-widest mt-[-10px]">RELIABILITY</div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {insightCategories.map((cat, i) => (
                        <motion.div
                            key={i}
                            className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-cyber-cyan/20 transition-all duration-500 backdrop-blur-sm group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -5 }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform group-hover:bg-cyber-cyan/10">
                                {cat.icon}
                            </div>
                            <h3 className="text-xl font-black text-white mb-6 italic tracking-tight uppercase group-hover:text-cyber-cyan transition-colors">
                                {cat.title}
                            </h3>
                            <ul className="space-y-4">
                                {cat.features.map((feat, idx) => (
                                    <li key={idx} className="flex items-start gap-3 group/item">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 mt-1.5 group-hover:bg-cyber-cyan group-hover/item:scale-150 transition-all" />
                                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors leading-tight">
                                            {feat}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default DeepInsightsSection;
