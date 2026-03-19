import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
    title: string;
    description: string;
    questions: mongoose.Schema.Types.ObjectId[];
    duration: number; // in minutes
    startTime: Date;
    endTime: Date;
    creatorId: mongoose.Schema.Types.ObjectId;
    status: 'draft' | 'published' | 'archived' | 'closed';
    resultsPublished: boolean;
    allowedGroups?: mongoose.Types.ObjectId[];
    allowedSubgroups?: mongoose.Types.ObjectId[];
    proctors?: mongoose.Schema.Types.ObjectId[];
    proctoringConfig: {
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
    isAdaptive: boolean;
    adaptiveConfig?: {
        questionPoolSize: number;
        questionsPerStudent: number;
        subject: string;
        topic: string;
    };
    generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
    autoCompleteAt?: Date;
    autoComplete: boolean;
    gracePeriod: number;
    createdAt: Date;
    updatedAt: Date;
}

const ExamSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    duration: { type: Number, required: true }, // duration in minutes
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'closed'],
        default: 'draft'
    },
    resultsPublished: { type: Boolean, default: false },
    allowedGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    allowedSubgroups: [{ type: Schema.Types.ObjectId, ref: 'Subgroup' }],
    proctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    proctoringConfig: {
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
    isAdaptive: { type: Boolean, default: false },
    adaptiveConfig: {
        questionPoolSize: { type: Number, default: 10 },
        questionsPerStudent: { type: Number, default: 15 },
        subject: { type: String },
        topic: { type: String }
    },
    generationStatus: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'failed'],
        default: 'pending'
    },
    autoCompleteAt: { type: Date, default: null },
    autoComplete: { type: Boolean, default: true },
    gracePeriod: { type: Number, default: 0 }
}, {
    timestamps: true
});

export default mongoose.model<IExam>('Exam', ExamSchema);
