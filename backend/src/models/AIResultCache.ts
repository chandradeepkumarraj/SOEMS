import mongoose, { Document, Schema } from 'mongoose';

/**
 * AI Result Cache Model
 * 
 * Stores hashes of AI inputs (Question + Answer) to avoid redundant LLM calls.
 */
export interface IAIResultCache extends Document {
    hash: string; // sha256 or similar representing {questionId, answerText}
    type: 'grading' | 'hei_analysis';
    result: any; // The processed AI output
    provider: string; // The provider used for evaluation
    aiModel: string; // The model used
    expiresAt: Date;
}

const AIResultCacheSchema: Schema = new Schema({
    hash: { type: String, required: true, unique: true },
    type: { type: String, enum: ['grading', 'hei_analysis'], required: true },
    result: { type: Schema.Types.Mixed, required: true },
    provider: { type: String, required: true },
    aiModel: { type: String, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } // 30-day default
}, {
    timestamps: true
});

// TTL Index for automatic pruning
AIResultCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IAIResultCache>('AIResultCache', AIResultCacheSchema);
