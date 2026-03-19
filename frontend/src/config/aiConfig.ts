import { Cpu, Globe, Sparkles } from 'lucide-react';

export interface AIProviderConfig {
    id: string;
    name: string;
    icon: any;
    color: string;
    desc: string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
    {
        id: 'ollama',
        name: 'Ollama',
        icon: Cpu,
        color: 'emerald',
        desc: 'Local AI instance. Privacy-first & Zero Cost.'
    },
    {
        id: 'openai',
        name: 'OpenAI',
        icon: Globe,
        color: 'blue',
        desc: 'GPT-4o / GPT-3.5. High performance, requires API Key.'
    },
    {
        id: 'gemini',
        name: 'Gemini',
        icon: Sparkles,
        color: 'red',
        desc: 'Google Gemini 1.5. Large context, requires API Key.'
    }
];

export const DEFAULT_AI_MODEL = 'AI Model';
export const DEFAULT_AI_PROVIDER = 'ollama';


