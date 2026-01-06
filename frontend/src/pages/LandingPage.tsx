import Navbar from '../components/landing/Navbar';
import ParticleSystem from '../components/landing/ParticleSystem';
import Hero from '../components/landing/Hero';
import FeatureCards from '../components/landing/FeatureCards';
import ProctoringSection from '../components/landing/ProctoringSection';
import AnalyticsSection from '../components/landing/AnalyticsSection';

// Using a simplified Footer for now, could be its own component later
const Footer = () => (
    <footer className="py-24 border-t border-white/5 bg-[#050816] text-slate-500 relative z-10 transition-all">
        <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="md:col-span-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyber-cyan to-cyber-purple rounded-lg flex items-center justify-center text-white font-black shadow-glow-cyan text-sm">S</div>
                        <span className="text-2xl font-black text-white tracking-tighter">SOEMS</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-400 font-medium">
                        Next-generation serverless examination platform engineered for absolute integrity and infinite scale.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em] text-cyber-cyan">Platform</h4>
                    <ul className="space-y-4 text-sm font-bold uppercase tracking-wider text-[10px]">
                        <li><a href="#features" className="hover:text-cyber-cyan transition-colors">Core Modules</a></li>
                        <li><a href="#proctoring" className="hover:text-cyber-cyan transition-colors">Surveillance</a></li>
                        <li><a href="#analytics" className="hover:text-cyber-cyan transition-colors">Intelligence</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em] text-cyber-blue">Resources</h4>
                    <ul className="space-y-4 text-sm font-bold uppercase tracking-wider text-[10px]">
                        <li><a href="#" className="hover:text-cyber-cyan transition-colors">Documentation</a></li>
                        <li><a href="#" className="hover:text-cyber-cyan transition-colors">API Reference</a></li>
                        <li><a href="#" className="hover:text-cyber-cyan transition-colors">Case Studies</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em] text-cyber-purple">Legal</h4>
                    <ul className="space-y-4 text-sm font-bold uppercase tracking-wider text-[10px]">
                        <li><a href="#" className="hover:text-cyber-cyan transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-cyber-cyan transition-colors">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-cyber-cyan transition-colors">Security Audit</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em]">
                <p>© {new Date().getFullYear()} Serverless Online Examination Protocol.</p>
                <div className="flex gap-8">
                    <span className="flex items-center gap-2 text-cyber-blue"><div className="h-1.5 w-1.5 rounded-full bg-cyber-blue shadow-glow-blue animate-pulse" /> V2.4.0 NODE_STABLE</span>
                    <span className="flex items-center gap-2 text-cyber-green"><div className="h-1.5 w-1.5 rounded-full bg-cyber-green shadow-glow-green animate-pulse" /> GRID_ONLINE</span>
                </div>
            </div>
        </div>
    </footer>
);

const LandingPage = () => {
    return (
        <div id="landing-root" className="min-h-screen bg-cyber-dark overflow-x-hidden selection:bg-cyber-cyan/30 selection:text-white">
            <ParticleSystem />
            <Navbar />

            <main>
                <Hero />
                <FeatureCards />
                <ProctoringSection />
                <AnalyticsSection />
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
