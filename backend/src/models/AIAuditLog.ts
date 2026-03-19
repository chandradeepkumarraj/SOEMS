import mongoose, { Schema, Document } from 'mongoose';

export interface IAIAuditLog extends Document {
    provider: string;
    aiModel: string;
    context: string; // e.g., 'grading', 'cat_gen', 'hei_analysis'
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs: number;
    status: 'success' | 'failure';
    isFallback: boolean;
    errorMessage?: string;
    timestamp: Date;
}

const AIAuditLogSchema: Schema = new Schema({
    provider: { type: String, required: true },
    aiModel: { type: String, required: true },
    context: { type: String, required: true },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    totalTokens: { type: Number },
    latencyMs: { type: Number, required: true },
    status: { type: String, enum: ['success', 'failure'], required: true },
    isFallback: { type: Boolean, default: false },
    errorMessage: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// TTL index to automatically remove old logs after 30 days to save space
AIAuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<IAIAuditLog>('AIAuditLog', AIAuditLogSchema);
