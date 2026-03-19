import React from 'react';
import { AlertCircle, ShieldCheck, Power } from 'lucide-react';

interface ProviderSettingsProps {
    providerId: string;
    register: any;
    watch: any;
    setValue: any;
}

export const ProviderSettings: React.FC<ProviderSettingsProps> = ({ providerId, register, watch, setValue }) => {
    const isEnabled = watch(`${providerId}.enabled`);

    const KillSwitch = ({ id }: { id: string }) => (
        <div className="flex items-center justify-between p-4 mb-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${watch(`${id}.enabled`) ? 'bg-success/20 text-success' : 'bg-slate-200 text-slate-400'}`}>
                    <Power className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-tight">Enable Provider</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {watch(`${id}.enabled`) ? 'Provider is active and accepting requests' : 'Provider is offline / Kill switch active'}
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => {
                    const current = watch(`${id}.enabled`);
                    setValue(`${id}.enabled`, !current);
                }}
                className="relative inline-flex items-center"
            >
                <input
                    type="checkbox"
                    {...register(`${id}.enabled`)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-success"></div>
            </button>
        </div>
    );

    if (providerId === 'ollama') {
        return (
            <div className="space-y-6">
                <KillSwitch id="ollama" />
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Base endpoint URL</label>
                        <input
                            type="text"
                            {...register('ollama.url')}
                            placeholder="http://localhost:11434"
                            className="w-full px-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Model Identifier</label>
                        <input
                            type="text"
                            {...register('ollama.model')}
                            placeholder="e.g. llama3.2, qwen2.5"
                            className="w-full px-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Temperature ({watch('ollama.temperature')})</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            {...register('ollama.temperature', { valueAsNumber: true })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Max Response Tokens ({watch('ollama.maxTokens') || 4096})</label>
                        <input
                            type="number"
                            min="1"
                            max="8192"
                            {...register('ollama.maxTokens', { valueAsNumber: true, min: 1 })}
                            className="w-full px-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed">
                        Ollama is a local LLM runner. Ensure the service is running on your server and reachable at the provided URL. No API Key required.
                    </p>
                </div>
            </div>
        );
    }

    if (providerId === 'openai') {
        return (
            <div className="space-y-6">
                <KillSwitch id="openai" />
                <div className={`space-y-6 transition-opacity ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">OpenAI API Secret Key</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                            <input
                                type="password"
                                {...register('openai.apiKey')}
                                placeholder="sk-..."
                                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Chat Model</label>
                            <input
                                type="text"
                                {...register('openai.model')}
                                placeholder="gpt-4o"
                                className="w-full px-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Temperature ({watch('openai.temperature')})</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                {...register('openai.temperature', { valueAsNumber: true })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Max Request Tokens ({watch('openai.maxTokens') || 4096})</label>
                        <input
                            type="number"
                            min="1"
                            max="8192"
                            {...register('openai.maxTokens', { valueAsNumber: true, min: 1 })}
                            className="w-full px-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (providerId === 'gemini') {
        return (
            <div className="space-y-6">
                <KillSwitch id="gemini" />
                <div className={`space-y-6 transition-opacity ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Google AI API Key</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                            <input
                                type="password"
                                {...register('gemini.apiKey')}
                                placeholder="Alza..."
                                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Gemini Model</label>
                            <input
                                type="text"
                                {...register('gemini.model')}
                                placeholder="gemini-1.5-flash"
                                className="w-full px-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Temperature ({watch('gemini.temperature')})</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                {...register('gemini.temperature', { valueAsNumber: true })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Max Output Tokens ({watch('gemini.maxTokens') || 4096})</label>
                        <input
                            type="number"
                            min="1"
                            max="8192"
                            {...register('gemini.maxTokens', { valueAsNumber: true, min: 1 })}
                            className="w-full px-4 py-3 bg-[var(--bg-main)] border-2 border-[var(--border-main)] rounded-xl font-bold focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
