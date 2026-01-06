import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'Proctoring', href: '#proctoring' },
        { name: 'Analytics', href: '#analytics' }
    ];

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple z-[60] origin-left"
                style={{ scaleX }}
            />
            <motion.nav
                className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 transition-all duration-300 ${isScrolled
                    ? 'bg-cyber-dark/80 backdrop-blur-xl border-b border-cyber-cyan/20'
                    : 'bg-transparent'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/">
                        <motion.div
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-cyber-cyan to-cyber-purple rounded-xl flex items-center justify-center text-white text-xl shadow-glow-cyan">
                                S
                            </div>
                            <span
                                className="text-3xl font-black bg-gradient-to-r from-cyber-cyan to-cyber-blue bg-clip-text"
                                style={{ WebkitBackgroundClip: 'text' }}
                            >
                                SOEMS
                            </span>
                        </motion.div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex gap-8">
                        {navLinks.map((item) => (
                            <motion.a
                                key={item.name}
                                href={item.href}
                                className="text-slate-300 hover:text-cyber-cyan transition-colors font-medium tracking-wide"
                                whileHover={{ y: -2 }}
                            >
                                {item.name}
                            </motion.a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <motion.button
                                className="hidden md:block px-6 py-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Sign In
                            </motion.button>
                        </Link>

                        <button
                            className="md:hidden text-cyber-cyan p-2"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="md:hidden absolute top-full left-0 right-0 bg-cyber-dark/95 backdrop-blur-2xl border-b border-cyber-cyan/20 px-6 py-8"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="flex flex-col gap-6">
                                {navLinks.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="text-xl text-slate-300 hover:text-cyber-cyan transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </a>
                                ))}
                                <div className="flex flex-col gap-4 pt-4 border-t border-cyber-cyan/10">
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                        <button className="w-full py-4 rounded-xl bg-cyber-cyan text-cyber-dark font-bold shadow-glow-cyan">
                                            Sign In
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </>
    );
};

export default Navbar;
