import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto';

export interface ISystemConfig extends Document {
    aiEnabled: boolean;
    fuzzyLogicEnabled: boolean;
    activeProvider: 'ollama' | 'openai' | 'gemini';
    maintenanceMode: boolean;
    proctoringDefaults: {
        enableTabLock: boolean;
        enableFullscreen: boolean;
        enableInputLock: boolean;
        enableFaceDetection: boolean;
        enableVoiceDetection: boolean;
        enableGazeTracking: boolean;
        violationThreshold: number;
        performanceSettings: {
            gazeYawThreshold: number;
            faceScoreThreshold: number;
            audioRMSThreshold: number;
            violationCooldownMs: number;
        };
    };
    examDefaults: {
        defaultDuration: number;
        passingScore: number;
        autoComplete: boolean;
        allowedTypes: {
            multipleChoice: boolean;
            trueFalse: boolean;
            code: boolean;
        };
    };
    ollama: {
        enabled: boolean;
        url: string;
        model: string;
        temperature: number;
        maxTokens: number;
    };
    openai: {
        enabled: boolean;
        apiKey: string;
        model: string;
        temperature: number;
        maxTokens: number;
    };
    gemini: {
        enabled: boolean;
        apiKey: string;
        model: string;
        temperature: number;
        maxTokens: number;
    };
    updatedAt: Date;
}

const SystemConfigSchema: Schema = new Schema({
    aiEnabled: { type: Boolean, default: true },
    fuzzyLogicEnabled: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    proctoringDefaults: {
        enableTabLock: { type: Boolean, default: true },
        enableFullscreen: { type: Boolean, default: true },
        enableInputLock: { type: Boolean, default: true },
        enableFaceDetection: { type: Boolean, default: true },
        enableVoiceDetection: { type: Boolean, default: true },
        enableGazeTracking: { type: Boolean, default: false },
        violationThreshold: { type: Number, default: 5 },
        performanceSettings: {
            gazeYawThreshold: { type: Number, default: 40 },
            faceScoreThreshold: { type: Number, default: 0.45 },
            audioRMSThreshold: { type: Number, default: 0.010 },
            violationCooldownMs: { type: Number, default: 15000 }
        }
    },
    examDefaults: {
        defaultDuration: { type: Number, default: 60 },
        passingScore: { type: Number, default: 40 },
        autoComplete: { type: Boolean, default: true },
        allowedTypes: {
            multipleChoice: { type: Boolean, default: true },
            trueFalse: { type: Boolean, default: true },
            code: { type: Boolean, default: true }
        }
    },
    activeProvider: { type: String, enum: ['ollama', 'openai', 'gemini'], default: 'ollama' },
    ollama: {
        enabled: { type: Boolean, default: true },
        url: { type: String, default: 'http://localhost:11434' },
        model: { type: String, default: 'qwen2.5:7b' },
        temperature: { type: Number, default: 0.3 },
        maxTokens: { type: Number, default: 4096 }
    },
    openai: {
        enabled: { type: Boolean, default: true },
        apiKey: {
            type: String,
            default: '',
            get: (val: string) => decrypt(val),
            set: (val: string) => encrypt(val)
        },
        model: { type: String, default: 'gpt-4o' },
        temperature: { type: Number, default: 0.3 },
        maxTokens: { type: Number, default: 4096 }
    },
    gemini: {
        enabled: { type: Boolean, default: true },
        apiKey: {
            type: String,
            default: '',
            get: (val: string) => decrypt(val),
            set: (val: string) => encrypt(val)
        },
        model: { type: String, default: 'gemini-1.5-flash' },
        temperature: { type: Number, default: 0.3 },
        maxTokens: { type: Number, default: 4096 }
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Ensure only one config document exists
SystemConfigSchema.statics.getOrCreate = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
