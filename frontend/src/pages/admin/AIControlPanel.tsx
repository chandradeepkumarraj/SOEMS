import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
    Save,
    ShieldCheck,
    AlertCircle,
    Settings,
    Power,
    CheckCircle2,
    Loader2,
    Zap
} from 'lucide-react';
import { getAIConfig, updateAIConfig } from '../../services/adminService';
import apiClient from '../../services/apiClient';
import { Button } from '../../components/ui/Button';
import { AI_PROVIDERS } from '../../config/aiConfig';
import { ProviderCard } from '../../components/admin/ProviderCard';
import { ProviderSettings } from '../../components/admin/ProviderSettings';


export default function AIControlPanel() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { register, handleSubmit, watch, reset, setValue } = useForm({
        defaultValues: {
            aiEnabled: true,
            fuzzyLogicEnabled: false,
            activeProvider: 'ollama',
            ollama: { enabled: true, url: '', model: '', temperature: 0.3, maxTokens: 4096 },
            openai: { enabled: true, apiKey: '', model: '', temperature: 0.3, maxTokens: 4096 },
            gemini: { enabled: true, apiKey: '', model: '', temperature: 0.3, maxTokens: 4096 }
        },
        shouldUnregister: false
    });

    const activeProvider = watch('activeProvider');
    const aiEnabled = watch('aiEnabled');
    const fuzzyLogicEnabled = watch('fuzzyLogicEnabled');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getAIConfig();
                reset(data);
            } catch (error) {
                console.error('Failed to fetch AI configuration:', error);
                setMessage({ type: 'error', text: 'Failed to load system configuration.' });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [reset]);

    const onSubmit = async (data: any) => {
        setSaving(true);
        setMessage(null);
        try {
            const updated = await updateAIConfig(data);
            reset(updated);
            setMessage({ type: 'success', text: 'AI Configuration updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to update configuration: ' + (error.response?.data?.message || error.message) });
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const data = watch();
            const response = await apiClient.post('/api/ai/test-connection', {
                provider: activeProvider,
                config: data
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Connection Verified: ' + response.data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Connection Failed: ' + (error.response?.data?.message || error.message) });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Neural Engine...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        AI Control Panel
                    </h1>
                    <p className="text-slate-500 font-bold italic">Global System Intelligence Configuration</p>
                </div>

                <div className="flex items-center gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-main)] shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Master AI Switch</span>
                        <span className={`text-xs font-black uppercase ${aiEnabled ? 'text-success' : 'text-danger'}`}>
                            {aiEnabled ? 'System Intelligence Active' : 'System Intelligence Offline'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setValue('aiEnabled', !aiEnabled)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${aiEnabled ? 'bg-success' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-main)] shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fuzzy Logic Fallback</span>
                        <span className={`text-xs font-black uppercase ${fuzzyLogicEnabled ? 'text-primary' : 'text-slate-400'}`}>
                            {fuzzyLogicEnabled ? 'Intelligent Routing ON' : 'Direct Routing Only'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setValue('fuzzyLogicEnabled', !fuzzyLogicEnabled)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${fuzzyLogicEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${fuzzyLogicEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                            }`}
                    >
                        {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <p className="font-bold text-sm tracking-tight">{message.text}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {AI_PROVIDERS.map((p) => (
                    <ProviderCard
                        key={p.id}
                        provider={p}
                        isActive={activeProvider === p.id}
                        isEnabled={
                            p.id === 'ollama' ? watch('ollama.enabled') :
                            p.id === 'openai' ? watch('openai.enabled') :
                            p.id === 'gemini' ? watch('gemini.enabled') : true
                        }
                        onClick={() => setValue('activeProvider', p.id as any)}
                    />
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <motion.div
                    layout
                    className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-main)] shadow-xl overflow-hidden mb-8"
                >
                    <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-lg">
                                <Settings className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tighter">Provider Configuration</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Selected: {activeProvider}</p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testing}
                            className="bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] h-10 px-4 group"
                        >
                            {testing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Zap className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
                            )}
                            {testing ? 'Verifying...' : 'Test Connection'}
                        </Button>
                    </div>

                    <div className="p-8">
                        <ProviderSettings
                            providerId={activeProvider}
                            register={register}
                            watch={watch}
                            setValue={setValue}
                        />
                    </div>

                    <div className="p-6 bg-[var(--bg-main)] border-t border-[var(--border-main)] flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => reset()}
                            className="font-black text-xs h-12 px-8 uppercase"
                        >
                            Discard Changes
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="font-black text-xs h-12 px-8 uppercase shadow-lg shadow-primary/20"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Configuration
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </form>

            <footer className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                <div className="flex items-center gap-3 p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                    <Power className="h-5 w-5 text-slate-400" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Note</p>
                        <p className="text-[10px] font-bold text-slate-400">API keys are AES-256 encrypted. Masks prevent accidental exposure.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Policy</p>
                        <p className="text-[10px] font-bold text-slate-400">Configuration syncs across all nodes within 5 seconds of save.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
