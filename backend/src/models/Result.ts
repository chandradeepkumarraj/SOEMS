import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    examId: mongoose.Schema.Types.ObjectId;
    score: number;
    totalPoints: number;
    answers: {
        questionId: mongoose.Schema.Types.ObjectId;
        selectedOption?: number;
        textAnswer?: string;
        isCorrect: boolean;
        score?: number;
        aiFeedback?: string;
        missingConcepts?: string[];
        remediationSteps?: string[];
        timeSpent: number; // in seconds
    }[];
    isSuspended: boolean;
    submittedAt: Date;
    heiScore?: number; // 0-100 score indicating academic honesty integrity
    heiSummary?: string; // Descriptive AI behavioral summary
    badges?: Array<{
        type: 'rank' | 'speed' | 'integrity';
        icon: string;
        label: string;
        description: string;
    }>;
    gradingStatus: 'completed' | 'pending';
    pendingGradingCount: number;
}

const ResultSchema: Schema = new Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: Number }, // Required for MCQ
        textAnswer: { type: String }, // Required for Descriptive
        isCorrect: { type: Boolean }, // Automated for MCQ, derived from AI for Descriptive
        score: { type: Number }, // AI assigned score (0-10 or similar)
        aiFeedback: { type: String }, // Detailed feedback from LLM
        missingConcepts: [{ type: String }], // Round 5: Key points missed
        remediationSteps: [{ type: String }], // Round 5: Specific study suggestions
        timeSpent: { type: Number, default: 0 }
    }],
    isSuspended: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    heiScore: { type: Number },
    heiSummary: { type: String },
    badges: [{
        type: { type: String, enum: ['rank', 'speed', 'integrity'] },
        icon: { type: String },
        label: { type: String },
        description: { type: String }
    }],
    gradingStatus: { type: String, enum: ['completed', 'pending'], default: 'completed' },
    pendingGradingCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Ensure only one result per student per exam
ResultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

// Optimize for ranking and lookup by exam
ResultSchema.index({ examId: 1, score: -1 });

// Optimize for time-based sorting
ResultSchema.index({ submittedAt: -1 });

export default mongoose.model<IResult>('Result', ResultSchema);
