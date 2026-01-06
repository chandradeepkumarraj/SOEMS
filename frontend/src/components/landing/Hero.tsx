import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { FiPlay } from 'react-icons/fi';
import { Link } from 'react-router-dom';
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

const Hero = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.3 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
    };

    return (
        <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-20 px-4">
            {/* Background Decorative Glows */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyber-cyan/30 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyber-purple/20 rounded-full blur-[140px] animate-pulse-slow" />

            <motion.div
                className="relative z-10 max-w-6xl mx-auto text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    variants={itemVariants}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/5 backdrop-blur-md mb-8"
                >
                    <FiPlay className="text-cyber-cyan animate-pulse" />
                    <span className="text-cyber-cyan text-sm font-bold tracking-widest uppercase">
                        Next-Gen Examination Platform
                    </span>
                </motion.div>

                <motion.h1
                    variants={itemVariants}
                    className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight"
                >
                    <span className="text-white drop-shadow-lg">Master Your</span>
                    <br />
                    <span className="bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple bg-clip-text pb-4 inline-block drop-shadow-sm" style={{ WebkitBackgroundClip: 'text' }}>
                        Digital Assessments
                    </span>
                </motion.h1>

                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                    SOEMS delivers a secure, serverless infrastructure for enterprise-grade examinations.
                    Experience AI-powered proctoring, real-time analytics, and seamless reliability.
                </motion.p>

                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
                >
                    <Link to="/login">
                        <motion.button
                            className="px-10 py-5 rounded-[1.25rem] bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-dark font-black text-xl shadow-glow-cyan hover:shadow-glow-cyan-lg transition-all flex items-center gap-3"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Establish Session
                            <FiPlay size={22} className="fill-current" />
                        </motion.button>
                    </Link>

                    <motion.button
                        className="px-10 py-5 rounded-[1.25rem] border-2 border-slate-700 bg-white/5 backdrop-blur-md text-slate-200 font-bold text-lg flex items-center gap-3 hover:bg-white/10 hover:border-cyber-cyan/30 transition-all"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Explore Modules
                    </motion.button>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-12 border-t border-slate-800/50"
                >
                    <div className="group cursor-default">
                        <div className="text-3xl md:text-4xl font-black mb-1 text-cyber-cyan group-hover:drop-shadow-[0_0_8px_rgba(0,163,224,0.3)] transition-all">
                            <Counter value={1000} />+
                        </div>
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Concurrent Users</div>
                    </div>

                    <div className="group cursor-default">
                        <div className="text-3xl md:text-4xl font-black mb-1 text-cyber-blue group-hover:drop-shadow-[0_0_8px_rgba(0,163,224,0.3)] transition-all">
                            <Counter value={99} />.99%
                        </div>
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Uptime SLA</div>
                    </div>

                    <div className="group cursor-default">
                        <div className="text-3xl md:text-4xl font-black mb-1 text-cyber-purple group-hover:drop-shadow-[0_0_8px_rgba(0,163,224,0.3)] transition-all">
                            &lt;<Counter value={200} />ms
                        </div>
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Latency</div>
                    </div>

                    <div className="group cursor-default">
                        <div className="text-3xl md:text-4xl font-black mb-1 text-cyber-pink group-hover:drop-shadow-[0_0_8px_rgba(0,163,224,0.3)] transition-all">
                            <Counter value={92} />%
                        </div>
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Cheating Detection</div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#00A3E0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </section>
    );
};

export default Hero;
