import mongoose, { Document, Schema } from 'mongoose';

/**
 * AI Task Model
 * 
 * Represents a persistent, background AI request (e.g., grading a student answer).
 * This ensures durability — if the server restarts, pending tasks are not lost.
 */
export interface IAITask extends Document {
    type: 'grading' | 'hei_analysis' | 'question_gen';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    priority: number; // Higher is faster
    payload: any; // { studentId, examId, questionId, textAnswer, referenceAnswer, ... }
    result?: any; // The final JSON or text from the AI
    attempts: number;
    lastError?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AITaskSchema: Schema = new Schema({
    type: { type: String, enum: ['grading', 'hei_analysis', 'question_gen'], required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    priority: { type: Number, default: 0 },
    payload: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    completedAt: { type: Date }
}, {
    timestamps: true
});

// Indexes for the worker
AITaskSchema.index({ status: 1, priority: -1, createdAt: 1 });
AITaskSchema.index({ 'payload.studentId': 1, 'payload.examId': 1 });

export default mongoose.model<IAITask>('AITask', AITaskSchema);
