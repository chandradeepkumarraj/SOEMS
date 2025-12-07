import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
    title: string;
    description: string;
    questions: mongoose.Schema.Types.ObjectId[];
    duration: number; // in minutes
    startTime: Date;
    endTime: Date;
    creatorId: mongoose.Schema.Types.ObjectId;
    status: 'draft' | 'published' | 'archived';
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
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
}, {
    timestamps: true
});

export default mongoose.model<IExam>('Exam', ExamSchema);
