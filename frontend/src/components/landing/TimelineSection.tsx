
import { motion } from 'framer-motion';

const milestones = [
    {
        date: "Feb 10, 2026",
        title: "Foundation Phase",
        description: "Initial deployment of core examination engine and hierarchical authentication protocols.",
        status: "Completed",
        side: "left"
    },
    {
        date: "Feb 20, 2026",
        title: "AI Infrastructure",
        description: "Integration of AI Control Panel with persistent task queuing and fuzzy logic fallbacks.",
        status: "Completed",
        side: "right"
    },
    {
        date: "Mar 01, 2026",
        title: "Identity Refinement",
        description: "Global CSS overhaul and unification of all four user portals under a shared shell architecture.",
        status: "Completed",
        side: "left"
    },
    {
        date: "Mar 10, 2026",
        title: "Adaptive Mastery",
        description: "Release of CAT (Adaptive Testing) and HEI (Honesty Index) for predictive proctoring.",
        status: "Completed",
        side: "right"
    },
    {
        date: "Present",
        title: "Global Scale",
        description: "Social recognition systems and multi-node optimization for extreme concurrency.",
        status: "Active",
        side: "left"
    }
];

const TimelineSection = () => {
    return (
        <section id="timeline" className="py-32 px-4 bg-cyber-dark relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.h2 
                        className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        DEVELOPMENT <span className="text-cyber-cyan italic">ROADMAP</span>
                    </motion.h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">Evolutionary Progress Protocol</p>
                </div>

                <div className="relative mt-20">
                    {/* Vertical Line */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-cyan via-cyber-purple to-transparent opacity-30 hidden md:block" />

                    <div className="space-y-24">
                        {milestones.map((ms, i) => (
                            <motion.div
                                key={i}
                                className={`flex flex-col md:flex-row items-center gap-10 ${ms.side === 'right' ? 'md:flex-row-reverse' : ''}`}
                                initial={{ opacity: 0, x: ms.side === 'left' ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                            >
                                {/* Milestone Card */}
                                <div className="md:w-1/2 flex justify-center">
                                    <div className={`p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-cyber-cyan/30 transition-all duration-500 max-w-md relative group ${ms.status === 'Active' ? 'shadow-glow-cyan/10 ring-1 ring-cyber-cyan/30' : ''}`}>
                                        <div className="absolute -top-4 -right-4 px-4 py-1.5 rounded-full bg-slate-900 border border-white/10 text-[9px] font-black text-slate-500 group-hover:text-cyber-cyan transition-colors z-20">
                                            {ms.date}
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-4 italic tracking-tight uppercase">{ms.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed font-medium mb-6">
                                            {ms.description}
                                        </p>
                                        <div className={`text-[9px] font-black uppercase tracking-widest ${ms.status === 'Completed' ? 'text-cyber-green' : 'text-cyber-cyan animate-pulse'}`}>
                                            STATUS: {ms.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Center Dot */}
                                <div className="relative z-20 hidden md:block">
                                    <div className={`h-4 w-4 rounded-full border-4 border-cyber-dark ${ms.status === 'Completed' ? 'bg-cyber-purple' : 'bg-cyber-cyan shadow-glow-cyan'}`} />
                                </div>

                                {/* Spacer for Timeline side */}
                                <div className="md:w-1/2 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TimelineSection;
