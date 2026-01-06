import mongoose, { Document, Schema } from 'mongoose';

export interface IExamSession extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    examId: mongoose.Schema.Types.ObjectId;
    startTime: Date;
    lastSyncTime: Date;
    answers: Map<string, number>; // questionId -> selectedOption
    timeSpent: Map<string, number>; // questionId -> seconds
    flagged: Map<string, boolean>; // questionId -> boolean
    status: 'in-progress' | 'completed';
    isExpired: boolean;
    violationCount: number;
    isSuspended: boolean;
}

const ExamSessionSchema: Schema = new Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    startTime: { type: Date, default: Date.now },
    lastSyncTime: { type: Date, default: Date.now },
    answers: {
        type: Map,
        of: Number,
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
    isSuspended: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Ensure only one active session per student per exam
ExamSessionSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export default mongoose.model<IExamSession>('ExamSession', ExamSessionSchema);
