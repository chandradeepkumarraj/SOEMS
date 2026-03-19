import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';
import { z } from 'zod';
import { maskKey } from '../utils/crypto';
import { testConnection } from '../modules/ai/aiService';

/**
 * @desc    Get Global AI Configuration
 * @route   GET /api/admin/config/ai
 * @access  Private (Admin)
 */
export const getAIConfig = async (req: Request, res: Response) => {
    try {
        const config = await (SystemConfig as any).getOrCreate();
        const safeConfig = config.toObject();

        // Mask API Keys for security
        if (safeConfig.openai?.apiKey) {
            safeConfig.openai.apiKey = maskKey(safeConfig.openai.apiKey);
        }
        if (safeConfig.gemini?.apiKey) {
            safeConfig.gemini.apiKey = maskKey(safeConfig.gemini.apiKey);
        }

        res.json(safeConfig);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update Global AI Configuration
 * @route   PUT /api/admin/config/ai
 * @access  Private (Admin)
 */
export const updateAIConfig = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            aiEnabled: z.boolean().optional(),
            fuzzyLogicEnabled: z.boolean().optional(),
            activeProvider: z.enum(['ollama', 'openai', 'gemini']).optional(),
            maintenanceMode: z.boolean().optional(),
            proctoringDefaults: z.object({
                enableTabLock: z.boolean().optional(),
                enableFullscreen: z.boolean().optional(),
                enableInputLock: z.boolean().optional(),
                enableFaceDetection: z.boolean().optional(),
                enableVoiceDetection: z.boolean().optional(),
                enableGazeTracking: z.boolean().optional(),
                violationThreshold: z.number().min(1).max(50).optional()
            }).optional(),
            examDefaults: z.object({
                defaultDuration: z.number().min(1).max(480).optional(),
                passingScore: z.number().min(0).max(100).optional(),
                autoComplete: z.boolean().optional(),
                allowedTypes: z.object({
                    multipleChoice: z.boolean().optional(),
                    trueFalse: z.boolean().optional(),
                    code: z.boolean().optional()
                }).optional()
            }).optional(),
            ollama: z.object({
                enabled: z.boolean().optional(),
                url: z.string().url().optional().or(z.literal('')),
                model: z.string().optional().or(z.literal('')),
                temperature: z.number().min(0).max(1).optional(),
                maxTokens: z.number().min(1).max(8192).optional()
            }).optional(),
            openai: z.object({
                enabled: z.boolean().optional(),
                apiKey: z.string().optional(),
                model: z.string().optional().or(z.literal('')),
                temperature: z.number().min(0).max(1).optional(),
                maxTokens: z.number().min(1).max(8192).optional()
            }).optional(),
            gemini: z.object({
                enabled: z.boolean().optional(),
                apiKey: z.string().optional(),
                model: z.string().optional().or(z.literal('')),
                temperature: z.number().min(0).max(1).optional(),
                maxTokens: z.number().min(1).max(8192).optional()
            }).optional()
        });

        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ message: 'Validation Failed', details: validation.error.errors });
        }

        const data = validation.data;
        const config = await (SystemConfig as any).getOrCreate();

        if (data.aiEnabled !== undefined) config.aiEnabled = data.aiEnabled;
        if (data.fuzzyLogicEnabled !== undefined) config.fuzzyLogicEnabled = data.fuzzyLogicEnabled;
        if (data.activeProvider) config.activeProvider = data.activeProvider;
        if (data.maintenanceMode !== undefined) config.maintenanceMode = data.maintenanceMode;

        if (data.proctoringDefaults) {
            config.proctoringDefaults = { ...config.proctoringDefaults.toObject(), ...data.proctoringDefaults };
        }

        if (data.examDefaults) {
            const currentExamDefaults = config.examDefaults.toObject();
            const newExamDefaults = { ...currentExamDefaults, ...data.examDefaults };
            
            if (data.examDefaults.allowedTypes) {
                newExamDefaults.allowedTypes = { ...currentExamDefaults.allowedTypes, ...data.examDefaults.allowedTypes };
            }
            
            config.examDefaults = newExamDefaults;
        }

        if (data.ollama) {
            if (data.ollama.enabled !== undefined) config.ollama.enabled = data.ollama.enabled;
            config.ollama.url = data.ollama.url !== undefined ? data.ollama.url : config.ollama.url;
            config.ollama.model = data.ollama.model !== undefined ? data.ollama.model : config.ollama.model;
            config.ollama.temperature = (data.ollama.temperature !== undefined && !isNaN(data.ollama.temperature)) ? data.ollama.temperature : config.ollama.temperature;
            config.ollama.maxTokens = (data.ollama.maxTokens !== undefined && !isNaN(data.ollama.maxTokens)) ? data.ollama.maxTokens : config.ollama.maxTokens;
        }

        if (data.openai) {
            if (data.openai.enabled !== undefined) config.openai.enabled = data.openai.enabled;
            // Only update key if it's NOT a mask and NOT the current masked key
            const currentMask = config.openai.apiKey ? maskKey(config.openai.apiKey) : '';
            if (data.openai.apiKey !== undefined && data.openai.apiKey !== currentMask && data.openai.apiKey !== '********') {
                config.openai.apiKey = data.openai.apiKey;
            }
            config.openai.model = data.openai.model !== undefined ? data.openai.model : config.openai.model;
            config.openai.temperature = (data.openai.temperature !== undefined && !isNaN(data.openai.temperature)) ? data.openai.temperature : config.openai.temperature;
            config.openai.maxTokens = (data.openai.maxTokens !== undefined && !isNaN(data.openai.maxTokens)) ? data.openai.maxTokens : config.openai.maxTokens;
        }

        if (data.gemini) {
            if (data.gemini.enabled !== undefined) config.gemini.enabled = data.gemini.enabled;
            const currentMask = config.gemini.apiKey ? maskKey(config.gemini.apiKey) : '';
            if (data.gemini.apiKey !== undefined && data.gemini.apiKey !== currentMask && data.gemini.apiKey !== '********') {
                config.gemini.apiKey = data.gemini.apiKey;
            }
            config.gemini.model = data.gemini.model !== undefined ? data.gemini.model : config.gemini.model;
            config.gemini.temperature = (data.gemini.temperature !== undefined && !isNaN(data.gemini.temperature)) ? data.gemini.temperature : config.gemini.temperature;
            config.gemini.maxTokens = (data.gemini.maxTokens !== undefined && !isNaN(data.gemini.maxTokens)) ? data.gemini.maxTokens : config.gemini.maxTokens;
        }

        await config.save();

        // Return masked config
        const safeConfig = config.toObject();
        if (safeConfig.openai?.apiKey) safeConfig.openai.apiKey = maskKey(safeConfig.openai.apiKey);
        if (safeConfig.gemini?.apiKey) safeConfig.gemini.apiKey = maskKey(safeConfig.gemini.apiKey);

        res.json(safeConfig);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Test AI Provider Connection
 * @route   POST /api/ai/test-connection
 * @access  Private (Admin/Teacher)
 */
export const testAIConfig = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            provider: z.enum(['ollama', 'openai', 'gemini']),
            config: z.any()
        });

        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ message: 'Validation Failed', details: validation.error.errors });
        }

        const { provider, config } = validation.data;

        // Ensure we retrieve the decrypted API key if a mask is provided
        const dbConfig = await (SystemConfig as any).getOrCreate();
        const mergedConfig = JSON.parse(JSON.stringify(config));

        if (provider === 'openai' && mergedConfig.openai?.apiKey?.includes('...')) {
            mergedConfig.openai.apiKey = dbConfig.openai.apiKey;
        }
        if (provider === 'gemini' && mergedConfig.gemini?.apiKey?.includes('...')) {
            mergedConfig.gemini.apiKey = dbConfig.gemini.apiKey;
        }

        const result = await testConnection(provider, mergedConfig);
        res.json({ success: true, message: result });
    } catch (error: any) {
        // Log the full error for server-side debugging
        console.error(`[AI Connectivity Test Error]:`, error.stack || error.message);

        // Return a clean error message to the client
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message
        });
    }
};/**
 * @desc    Get Maintenance Status (Public)
 * @route   GET /api/system/maintenance-status
 * @access  Public
 */
export const getMaintenanceStatus = async (req: Request, res: Response) => {
    try {
        const config = await (SystemConfig as any).getOrCreate();
        res.json({ maintenanceMode: config.maintenanceMode });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
