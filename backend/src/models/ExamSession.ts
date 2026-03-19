import mongoose, { Document, Schema } from 'mongoose';

export interface IExamSession extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    examId: mongoose.Schema.Types.ObjectId;
    startTime: Date;
    lastSyncTime: Date;
    answers: Map<string, any>; // questionId -> selectedOption (number) or textAnswer (string)
    timeSpent: Map<string, number>; // questionId -> seconds
    flagged: Map<string, boolean>; // questionId -> boolean
    status: 'in-progress' | 'completed';
    isExpired: boolean;
    violationCount: number;
    isSuspended: boolean;
    adaptiveState?: {
        currentDifficulty: 'easy' | 'medium' | 'hard';
        questionsServed: mongoose.Schema.Types.ObjectId[];
        trailingCorrect: number;
        trailingTotal: number;
    };
    evaluations?: Map<string, {
        score: number;
        isCorrect: boolean;
        feedback: string;
        missingConcepts: string[];
        remediationSteps: string[];
    }>;
    idCardFront?: string;
    idCardBack?: string;
}

const ExamSessionSchema: Schema = new Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    startTime: { type: Date, default: Date.now },
    lastSyncTime: { type: Date, default: Date.now },
    answers: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },
    timeSpent: {
        type: Map,
        of: Number,
        default: {}
    },
    flagged: {
        type: Map,
        of: Boolean,
        default: {}
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed'],
        default: 'in-progress'
    },
    isExpired: { type: Boolean, default: false },
    violationCount: { type: Number, default: 0 },
    isSuspended: { type: Boolean, default: false },
    adaptiveState: {
        currentDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        questionsServed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
        trailingCorrect: { type: Number, default: 0 },
        trailingTotal: { type: Number, default: 0 }
    },
    evaluations: {
        type: Map,
        of: {
            score: Number,
            isCorrect: Boolean,
            feedback: String,
            missingConcepts: [String],
            remediationSteps: [String]
        },
        default: {}
    },
    idCardFront: { type: String },
    idCardBack: { type: String }
}, {
    timestamps: true
});

// Ensure only one active session per student per exam
ExamSessionSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export default mongoose.model<IExamSession>('ExamSession', ExamSessionSchema);
