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
    proctoringConfig: {
        enableTabLock: boolean;
        enableFullscreen: boolean;
        enableInputLock: boolean;
        violationThreshold: number;
    };
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
    proctoringConfig: {
        enableTabLock: { type: Boolean, default: true },
        enableFullscreen: { type: Boolean, default: true },
        enableInputLock: { type: Boolean, default: true },
        violationThreshold: { type: Number, default: 5 }
    }
}, {
    timestamps: true
});

export default mongoose.model<IExam>('Exam', ExamSchema);
