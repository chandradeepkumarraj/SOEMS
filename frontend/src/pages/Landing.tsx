import React from 'react';
import { Button } from '../components/ui/Button';
import { ArrowRight, Shield, Clock, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold text-primary-dark">SOEMS</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login">
                                <Button variant="ghost">Log in</Button>
                            </Link>
                            <Link to="/register">
                                <Button>Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-16 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">
                            Secure, Intelligent <br />
                            <span className="text-primary">Examination Management</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10">
                            The complete platform for conducting secure online exams with AI-powered proctoring,
                            real-time analytics, and seamless student experience.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/register">
                                <Button size="lg" className="gap-2">
                                    Start Free Trial <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline">
                                View Demo
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">AI Proctoring</h3>
                            <p className="text-gray-600">
                                Advanced anti-cheating measures with face detection, gaze tracking, and tab monitoring.
                            </p>
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <Clock className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Real-time Analytics</h3>
                            <p className="text-gray-600">
                                Instant insights into student performance, exam difficulty, and class progress.
                            </p>
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <Brain className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Smart Question Bank</h3>
                            <p className="text-gray-600">
                                Create and manage diverse question types with automated grading and randomization.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
