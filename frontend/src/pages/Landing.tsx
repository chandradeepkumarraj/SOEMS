import { Button } from '../components/ui/Button';
import { ArrowRight, Shield, Clock, Brain, Lock, Users, BarChart, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Shield className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">SOEMS</span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Link to="/login">
                                <Button className="gap-2">
                                    Sign In <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-32">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl"
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.4, 0.6, 0.4]
                        }}
                        transition={{ duration: 6, repeat: Infinity }}
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        className="text-center max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.div
                            className="inline-block mb-6 px-4 py-2 bg-blue-50 rounded-full text-sm text-primary font-medium"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            🚀 Next-Gen Examination Platform
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                            Secure, Intelligent{' '}
                            <br />
                            <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Examination Management
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                            The complete platform for conducting secure online exams with admin-controlled access,
                            real-time monitoring, and AI-powered analytics.
                        </p>

                        <motion.div
                            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Link to="/login">
                                <Button size="lg" className="gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                                    Get Started <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div
                            className="flex flex-wrap justify-center gap-8 text-sm text-gray-600"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>Admin-Only Access Control</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>Real-Time Monitoring</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span>Secure & Encrypted</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
                        <p className="text-xl text-gray-600">Everything you need for modern online examinations</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Lock,
                                title: 'Admin-Controlled Access',
                                description: 'Only administrators can create users. Student and teacher accounts are managed centrally for maximum security.',
                                color: 'purple'
                            },
                            {
                                icon: Shield,
                                title: 'Live Proctoring Monitor',
                                description: 'Real-time monitoring of active exams with instant alerts for suspicious activities and tab switching.',
                                color: 'blue'
                            },
                            {
                                icon: Clock,
                                title: 'Real-time Analytics',
                                description: 'Instant insights into student performance, exam difficulty, and class progress with live updates.',
                                color: 'green'
                            },
                            {
                                icon: Brain,
                                title: 'Smart Question Bank',
                                description: 'Create and manage diverse question types with automated grading and intelligent randomization.',
                                color: 'orange'
                            },
                            {
                                icon: Users,
                                title: 'User Management',
                                description: 'Comprehensive admin panel for managing students, teachers, and system settings with CSV import/export.',
                                color: 'pink'
                            },
                            {
                                icon: BarChart,
                                title: 'Advanced Reports',
                                description: 'Detailed analytics with score distributions, question analysis, and downloadable performance reports.',
                                color: 'indigo'
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`h-7 w-7 text-${feature.color}-600`} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 bg-gradient-to-r from-primary to-blue-600">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold text-white mb-6">
                            Ready to Transform Your Examinations?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8">
                            Join educational institutions using SOEMS for secure, efficient online testing.
                        </p>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-6 border-0">
                                Sign In Now
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Shield className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold text-white">SOEMS</span>
                    </div>
                    <p className="text-sm">
                        Serverless Online Examination Management System
                    </p>
                    <p className="text-xs mt-2">
                        © 2024 SOEMS. Secure, Reliable, Professional.
                    </p>
                </div>
            </footer>
        </div>
    );
}
