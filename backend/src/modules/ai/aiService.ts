import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import SystemConfig from '../../models/SystemConfig';
import AIAuditLog from '../../models/AIAuditLog';
import AITask from '../../models/AITask';
import AIResultCache from '../../models/AIResultCache';

dotenv.config();

const OLLAMA_URL_DEFAULT = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL_DEFAULT = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

// --- AI Reliability Infrastructure ---

// 1. Concurrency Limiter
const createLimiter = (concurrency: number) => {
    const queue: any[] = [];
    let activeCount = 0;

    const next = () => {
        if (queue.length > 0 && activeCount < concurrency) {
            activeCount++;
            const { fn, resolve, reject } = queue.shift();
            fn().then(resolve).catch(reject).finally(() => {
                activeCount--;
                next();
            });
        }
    };

    return <T>(fn: () => Promise<T>): Promise<T> => new Promise<T>((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        next();
    });
};

const ollamaLimit = createLimiter(Number(process.env.AI_MAX_CONCURRENCY_OLLAMA) || 2);
const cloudLimit = createLimiter(Number(process.env.AI_MAX_CONCURRENCY_CLOUD) || 8);

// 2. Token/Character Guard
const validatePromptLength = (prompt: string, systemPrompt: string, limit: number) => {
    const totalLength = (prompt?.length || 0) + (systemPrompt?.length || 0);
    if (totalLength > limit) {
        throw new Error(`AI Request too large (${totalLength} chars). Max allowed is ${limit}.`);
    }
};

// 3. Telemetry Logger
const logAITelemetry = async (data: {
    provider: string,
    model: string,
    context: string,
    latencyMs: number,
    status: 'success' | 'failure',
    isFallback?: boolean,
    errorMessage?: string,
    tokens?: { prompt: number, completion: number }
}) => {
    try {
        await AIAuditLog.create({
            provider: data.provider,
            aiModel: data.model,
            context: data.context,
            promptTokens: data.tokens?.prompt,
            completionTokens: data.tokens?.completion,
            totalTokens: data.tokens ? (data.tokens.prompt + data.tokens.completion) : undefined,
            latencyMs: data.latencyMs,
            status: data.status,
            isFallback: data.isFallback || false,
            errorMessage: data.errorMessage
        });
    } catch (e) {
        console.error('[AI Telemetry] Failed to log telemetry:', e);
    }
};

const getActiveConfig = async () => {
    return await (SystemConfig as any).getOrCreate();
};

const generateAIHash = (prompt: string, systemPrompt: string): string => {
    return crypto.createHash('sha256').update(`${systemPrompt}|${prompt}`).digest('hex');
};

const checkCache = async (hash: string) => {
    try {
        return await AIResultCache.findOne({ hash, expiresAt: { $gt: new Date() } });
    } catch (e) {
        console.error('[AI Cache] Lookup failed:', e);
        return null;
    }
};

const saveToCache = async (hash: string, type: 'grading' | 'hei_analysis', result: any, provider: string, model: string) => {
    try {
        await AIResultCache.findOneAndUpdate(
            { hash },
            { type, result, provider, aiModel: model, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
            { upsert: true }
        );
    } catch (e) {
        console.error('[AI Cache] Save failed:', e);
    }
};

export const enqueueAITask = async (type: 'grading' | 'hei_analysis' | 'question_gen', payload: any, priority: number = 0) => {
    try {
        const task = await AITask.create({ type, payload, priority, status: 'pending' });
        console.log(`[AI Queue] Enqueued ${type} task: ${task._id}`);
        return task._id;
    } catch (e) {
        console.error('[AI Queue] Failed to enqueue task:', e);
        throw new Error('Failed to schedule background AI processing.');
    }
};

const repairJSON = (input: string): string => {
    let i = 0;
    const len = input.length;
    let output = '';

    const skipWhitespace = () => {
        while (i < len && ' \t\r\n'.includes(input[i])) {
            output += input[i];
            i++;
        }
    };

    const parseValue = (): void => {
        skipWhitespace();
        if (i >= len) return;
        const ch = input[i];
        if (ch === '"' || ch === "'") parseString(ch);
        else if (ch === '{') parseObject();
        else if (ch === '[') parseArray();
        else if (ch === 't' || ch === 'f' || ch === 'n' || ch === 'T' || ch === 'F' || ch === 'N') parseLiteral();
        else if (ch === '-' || (ch >= '0' && ch <= '9')) parseNumber();
        else { output += ch; i++; }
    };

    const parseString = (quote: string): void => {
        output += '"'; i++;
        while (i < len) {
            const ch = input[i];
            if (ch === '\\') {
                if (i + 1 < len) { output += ch + input[i + 1]; i += 2; }
                else { output += ch; i++; }
            } else if (ch === quote) {
                output += '"'; i++; return;
            } else if (ch === '"' && quote === "'") {
                output += '\\"'; i++;
            } else if (ch === '\n' || ch === '\r' || ch === '\t') {
                if (ch === '\n') output += '\\n';
                else if (ch === '\r') output += '\\r';
                else if (ch === '\t') output += '\\t';
                i++;
            } else {
                output += ch; i++;
            }
        }
        output += '"';
    };

    const parseObject = (): void => {
        output += '{'; i++;
        skipWhitespace();
        let needsComma = false;
        while (i < len && input[i] !== '}') {
            skipWhitespace();
            if (i >= len || input[i] === '}') break;
            if (input[i] === ',') { output += ','; i++; needsComma = false; continue; }
            if (needsComma) output += ',';
            skipWhitespace();
            if (input[i] === '"' || input[i] === "'") {
                parseString(input[i]);
            } else {
                let key = '';
                while (i < len && input[i] !== ':' && input[i] !== '}') { key += input[i]; i++; }
                output += '"' + key.trim() + '"';
            }
            skipWhitespace();
            if (i < len && input[i] === ':') { output += ':'; i++; }
            parseValue();
            needsComma = true;
            skipWhitespace();
        }
        if (i < len && input[i] === '}') { output += '}'; i++; }
        else output += '}';
    };

    const parseArray = (): void => {
        output += '['; i++;
        skipWhitespace();
        let needsComma = false;
        while (i < len && input[i] !== ']') {
            skipWhitespace();
            if (i >= len || input[i] === ']') break;
            if (input[i] === ',') { output += ','; i++; needsComma = false; continue; }
            if (needsComma) output += ',';
            parseValue();
            needsComma = true;
            skipWhitespace();
        }
        if (i < len && input[i] === ']') { output += ']'; i++; }
        else output += ']';
    };

    const parseLiteral = (): void => {
        let lit = '';
        while (i < len && /[a-zA-Z]/.test(input[i])) { lit += input[i]; i++; }
        const lower = lit.toLowerCase();
        if (lower === 'true') output += 'true';
        else if (lower === 'false') output += 'false';
        else if (lower === 'null' || lower === 'none') output += 'null';
        else output += '"' + lit + '"';
    };

    const parseNumber = (): void => {
        while (i < len && /[\d.eE+\-]/.test(input[i])) { output += input[i]; i++; }
    };

    const firstBrace = input.indexOf('{');
    const firstBracket = input.indexOf('[');
    if (firstBrace === -1 && firstBracket === -1) throw new Error('No JSON structure found.');
    i = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
    parseValue();
    return output.replace(/,\s*([\]}])/g, '$1');
};

const extractJSON = (text: string): any => {
    if (!text) throw new Error('Empty AI response.');
    try {
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        let start = -1, end = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            start = firstBrace; end = text.lastIndexOf('}');
        } else if (firstBracket !== -1) {
            start = firstBracket; end = text.lastIndexOf(']');
        }
        if (start !== -1 && end > start) return JSON.parse(text.substring(start, end + 1));
    } catch (_) { }

    try {
        const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (mdMatch?.[1]) return JSON.parse(mdMatch[1].trim());
    } catch (_) { }

    try {
        return JSON.parse(repairJSON(text));
    } catch (e: any) {
        console.error('[JSON Repair] Failed:', e.message);
        throw e;
    }
};

const callOllama = async (prompt: string, systemPrompt?: string, config?: any) => {
    const url = config?.ollama?.url || OLLAMA_URL_DEFAULT;
    const model = config?.ollama?.model || DEFAULT_MODEL_DEFAULT;
    const response = await axios.post(`${url}/api/generate`, {
        model, prompt, system: systemPrompt || "Expert academic evaluator.", stream: false,
        options: { num_predict: config?.ollama?.maxTokens || 4096, temperature: config?.ollama?.temperature || 0.3 }
    }, { timeout: 120000 }); // Boosted to 120s for large pools/spin-up
    return response.data.response;
};

const callOpenAI = async (prompt: string, systemPrompt?: string, config?: any) => {
    const apiKey = config?.openai?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API Key is missing.");
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: config?.openai?.model || 'gpt-4o',
        messages: [{ role: "system", content: systemPrompt || "Expert academic evaluator." }, { role: "user", content: prompt }],
        temperature: config?.openai?.temperature || 0.3, max_tokens: config?.openai?.maxTokens || 4096
    }, { headers: { 'Authorization': `Bearer ${apiKey}` }, timeout: 30000 });
    return response.data.choices[0].message.content;
};

const callGemini = async (prompt: string, systemPrompt?: string, config?: any) => {
    const apiKey = config?.gemini?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key is missing.");
    const model = config?.gemini?.model || 'gemini-1.5-flash';
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        contents: [{ parts: [{ text: `${systemPrompt ? systemPrompt + "\n\n" : ""}${prompt}` }] }],
        generationConfig: { temperature: config?.gemini?.temperature || 0.3, maxOutputTokens: config?.gemini?.maxTokens || 4096 }
    }, { timeout: 30000 });
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Gemini returned an empty or invalid response.');
    return response.data.candidates[0].content.parts[0].text;
};

export const askAI = async (prompt: string, systemPrompt: string = "Expert academic evaluator.", context: string = 'general') => {
    let provider = 'unknown'; let model = 'unknown'; let isFallbackRequest = false;
    const startTime = Date.now();
    try {
        const fullConfig = await getActiveConfig();
        const bestProvider = getBestAvailableProvider(fullConfig);
        if (!bestProvider) throw new Error("AI services disabled.");
        provider = bestProvider.id; model = bestProvider.config.model;
        isFallbackRequest = (bestProvider as any).isFallback || false;
        validatePromptLength(prompt, systemPrompt, 50000);
        const callProvider = async () => {
            switch (provider.toLowerCase()) {
                case 'openai': return await callOpenAI(prompt, systemPrompt, fullConfig);
                case 'gemini': return await callGemini(prompt, systemPrompt, fullConfig);
                default: return await callOllama(prompt, systemPrompt, fullConfig);
            }
        };
        const hash = (context === 'grading' || context === 'hei_analysis') ? generateAIHash(prompt, systemPrompt) : null;
        if (hash) { const cached = await checkCache(hash); if (cached) return cached.result; }
        const result = await (provider.toLowerCase() === 'ollama' ? ollamaLimit : cloudLimit)(callProvider);
        if (hash) await saveToCache(hash, context as any, result, provider, model);
        await logAITelemetry({ provider, model, context, latencyMs: Date.now() - startTime, status: 'success', isFallback: isFallbackRequest });
        return result;
    } catch (error: any) {
        await logAITelemetry({ provider, model, context, latencyMs: Date.now() - startTime, status: 'failure', isFallback: isFallbackRequest, errorMessage: error.message });
        throw error;
    }
};

/**
 * Tests the connection to an AI provider.
 */
export const testConnection = async (provider: string, config: any) => {
    const timeout = 10000;
    const testAxios = axios.create({ timeout });

    try {
        switch (provider.toLowerCase()) {
            case 'ollama': {
                const url = config?.ollama?.url || OLLAMA_URL_DEFAULT;
                const response = await testAxios.get(`${url}/api/tags`);
                return `Service online. Detected ${response.data.models?.length || 0} local models.`;
            }
            case 'openai': {
                const apiKey = config?.openai?.apiKey || process.env.OPENAI_API_KEY;
                const model = config?.openai?.model || 'gpt-4o';
                if (!apiKey) throw new Error("API Key missing");
                await testAxios.post('https://api.openai.com/v1/chat/completions', {
                    model: model,
                    messages: [{ role: "user", content: "ping" }],
                    max_tokens: 1
                }, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                return `OpenAI online. Model ${model} is ready.`;
            }
            case 'gemini': {
                const apiKey = config?.gemini?.apiKey || process.env.GEMINI_API_KEY;
                const model = config?.gemini?.model || 'gemini-1.5-flash';
                if (!apiKey) throw new Error("API Key missing");
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                await testAxios.post(url, {
                    contents: [{ parts: [{ text: "ping" }] }],
                    generationConfig: { maxOutputTokens: 1 }
                });
                return `Gemini online. Model ${model} is ready.`;
            }
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
        throw new Error(`${provider} Connection Failed: ${errorMsg}`);
    }
};

const getBestAvailableProvider = (config: any) => {
    if (!config.aiEnabled) return null;
    const active = config.activeProvider || 'ollama';
    if (config[active]?.enabled) return { id: active, config: config[active] };
    if (!config.fuzzyLogicEnabled) throw new Error(`Provider ${active} is disabled.`);
    for (const fId of ['gemini', 'openai', 'ollama']) {
        if (fId !== active && config[fId]?.enabled) return { id: fId, config: config[fId], isFallback: true };
    }
    throw new Error("No AI providers available.");
};

export const getProviderStatus = async () => {
    const config = await getActiveConfig();
    const p = config.activeProvider;
    return { provider: p, model: config[p]?.model || 'unknown', aiEnabled: config.aiEnabled };
};

export const evaluateDescriptiveAnswer = async (studentAnswer: string, referenceKey: string, questionText: string, maxPoints: number = 10) => {
    const prompt = `Evaluate Academic Answer: Q:"${questionText}" Ref:"${referenceKey}" Ans:"${studentAnswer}". Return JSON {score:number, feedback:string, missingConcepts:string[], remediationSteps:string[]}.`;
    const raw = await askAI(prompt, "Strict JSON.", 'grading');
    try {
        const p = extractJSON(raw);
        return {
            score: Math.min(maxPoints, Math.max(0, Number(p.score) || 0)),
            feedback: p.feedback || "Evaluation complete.",
            missingConcepts: Array.isArray(p.missingConcepts) ? p.missingConcepts : [],
            remediationSteps: Array.isArray(p.remediationSteps) ? p.remediationSteps : ["Manual review recommended."]
        };
    } catch (_) { return { score: 0, feedback: "Error parsing evaluation.", missingConcepts: [], remediationSteps: ["Manual review required."] }; }
};

export const generateQuestions = async (subject: string, topic: string, count: number, difficulty: string, type: string = 'mcq') => {
    const batchSize = 2; // Fixed small batch size for stability
    const allQuestions: any[] = [];
    const totalBatches = Math.ceil(count / batchSize);

    console.log(`[AI] Starting batched generation for ${count} questions (${totalBatches} batches)`);

    for (let b = 0; b < totalBatches; b++) {
        const currentBatchCount = Math.min(batchSize, count - allQuestions.length);
        const prompt = `Generate ${currentBatchCount} unique ${difficulty} ${type} questions for ${subject}/${topic}. 
        Return ONLY a JSON array of objects with exactly this structure:
        {
          "text": "The question text",
          "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
          "correctAnswer": 0,
          "points": 1
        }
        Ensure "correctAnswer" is an integer index (0 to 3).`;
        
        let batchSuccess = false;
        for (let i = 0; i < 3; i++) {
            try {
                process.stdout.write(`[AI] Generating batch ${b + 1}/${totalBatches} (${currentBatchCount} questions)... `);
                const raw = await askAI(prompt, "Strict JSON array only. No markdown formatting.", 'question_gen');
                let questions = extractJSON(raw);
                if (Array.isArray(questions)) {
                    // Normalization Step: Fix common AI naming mistakes
                    const mapped = questions.map(q => {
                        const normalized: any = {
                            text: q.text || q.question || q.desc || q.problem || '',
                            options: Array.isArray(q.options) ? q.options : (q.choices || q.answers || []),
                            correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : (q.answer !== undefined ? q.answer : (q.correct_index !== undefined ? q.correct_index : 0)),
                            points: q.points || 1,
                            difficulty
                        };
                        
                        // Ensure correctAnswer is a number
                        if (typeof normalized.correctAnswer === 'string') {
                            const parsed = parseInt(normalized.correctAnswer);
                            normalized.correctAnswer = isNaN(parsed) ? 0 : parsed;
                        }
                        
                        return normalized;
                    });

                    allQuestions.push(...mapped);
                    console.log('Done.');
                    batchSuccess = true;
                    break;
                }
            } catch (e: any) {
                console.log(`Error: ${e.message}`);
                if (i === 2) throw e;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        if (!batchSuccess) throw new Error(`Failed to generate batch ${b + 1}`);
    }

    return allQuestions;
};

export const generateImprovementReport = async (studentName: string, results: any[]) => {
    const prompt = `Analyze performance for ${studentName} based on these results: ${JSON.stringify(results)}. Provide actionable improvement steps. Return JSON { report: string }.`;
    const raw = await askAI(prompt, "Academic Counselor JSON.", 'improvement_report');
    try {
        const p = extractJSON(raw);
        return p.report || raw;
    } catch (_) {
        return raw;
    }
};

export const generateHEIReport = async (studentName: string, violationCount: number, flaggedData: any, examDurationMinutes: number) => {
    const fCount = flaggedData ? Object.keys(flaggedData).length : 0;
    const prompt = `Analyze Integrity for ${studentName}. Violations: ${violationCount}, Flags: ${fCount}, Time: ${examDurationMinutes}. Return JSON {heiScore:number, heiSummary:string}.`;
    const raw = await askAI(prompt, "Behavioral Analyst JSON.", 'hei_analysis');
    try { return extractJSON(raw); } catch (_) { return { heiScore: 100, heiSummary: "Analysis unavailable." }; }
};
