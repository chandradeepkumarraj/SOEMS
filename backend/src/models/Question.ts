import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
    text: string;
    options: string[];
    correctAnswer: number; // Index of the correct option (0-3)
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    creatorId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema: Schema = new Schema({
    text: { type: String, required: true },
    options: {
        type: [String],
        required: true,
        validate: [arrayLimit, '{PATH} must have at least 2 options']
    },
    correctAnswer: { type: Number, required: true },
    subject: { type: String, required: true },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true
});

function arrayLimit(val: string[]) {
    return val.length >= 2;
}

export default mongoose.model<IQuestion>('Question', QuestionSchema);
