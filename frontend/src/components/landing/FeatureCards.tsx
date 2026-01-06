
import { motion } from 'framer-motion';
import { FiShield, FiBarChart2, FiCpu, FiGlobe, FiClock, FiCheckCircle } from 'react-icons/fi';

const features = [
    {
        icon: <FiShield className="text-cyber-cyan" />,
        title: 'AI Proctoring',
        description: 'Advanced browser locking and real-time monitoring via Socket.io with 92% anomaly detection accuracy.',
        color: 'from-cyber-cyan/20 to-cyber-blue/5',
    },
    {
        icon: <FiBarChart2 className="text-cyber-purple" />,
        title: 'Real-time Analytics',
        description: 'Comprehensive performance dashboards with deep-dive question analysis and automated score distribution.',
        color: 'from-cyber-purple/20 to-cyber-pink/5',
    },
    {
        icon: <FiCpu className="text-cyber-green" />,
        title: 'Serverless Engine',
        description: 'Autoscaling infrastructure capable of handling 1000+ concurrent students with zero performance lag.',
    },
    {
        icon: <FiGlobe className="text-cyber-cyan" />,
        title: 'Global Access',
        description: 'Optimized for low-bandwidth environments with persistent state recovery and offline submission support.',
    },
    {
        icon: <FiClock className="text-cyber-blue" />,
        title: 'Live Monitoring',
        description: 'Instant proctor alerts and administrative controls to terminate sessions or provide live warnings.',
    },
    {
        icon: <FiCheckCircle className="text-cyber-pink" />,
        title: 'Automated Grading',
        description: 'Instant scoring for MCQs and complex question types with detailed student feedback loops.',
    },
];

const FeatureCards = () => {
    return (
        <section id="features" className="py-24 px-4 bg-cyber-dark relative overflow-hidden">
            {/* Decorative center glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-cyber-blue/5 rounded-full blur-[180px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <motion.h2
                        className="text-4xl md:text-6xl font-black text-white mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Engineered for <span className="text-cyber-cyan">Security</span>
                    </motion.h2>
                    <motion.p
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Our platform combines cutting-edge AI with a robust serverless architecture to ensure your examinations are fair, scalable, and seamless.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            className="group p-8 rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-cyber-cyan/30 transition-all duration-500 relative overflow-hidden glass-premium shadow-2xl"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                        >
                            <div className="absolute top-8 right-8 text-[10px] font-black text-slate-700 group-hover:text-cyber-cyan/40 transition-colors tracking-[0.5em] italic">
                                [0{idx + 1}]
                            </div>

                            <div className="relative z-10">
                                <div className="text-4xl mb-8 p-4 rounded-2xl bg-white/5 inline-block group-hover:scale-110 group-hover:shadow-glow-cyan transition-all duration-700 ring-1 ring-white/10">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-cyber-cyan transition-colors italic uppercase tracking-tighter">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400 leading-relaxed font-medium text-sm">
                                    {feature.description}
                                </p>
                                <div className="mt-8 h-1 w-0 group-hover:w-full bg-gradient-to-r from-cyber-cyan via-cyber-blue to-transparent transition-all duration-1000 rounded-full opacity-50" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureCards;
