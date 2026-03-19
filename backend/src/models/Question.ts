import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
    type: 'mcq' | 'descriptive';
    text: string;
    imageUrl?: string;       // Optional image displayed above the question
    options: string[];
    optionImages?: string[]; // Optional parallel image URL array for MCQ options
    correctAnswer: number;  // Index of the correct option (0-3)
    referenceAnswer?: string;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    creatorId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema: Schema = new Schema({
    type: {
        type: String,
        enum: ['mcq', 'descriptive'],
        default: 'mcq'
    },
    text: { type: String, required: true },
    imageUrl: { type: String, default: null },
    options: {
        type: [String],
        required: function (this: any) { return this.type === 'mcq'; },
        validate: [arrayLimit, '{PATH} must have at least 2 options for MCQ']
    },
    optionImages: { type: [String], default: [] },
    correctAnswer: {
        type: Number,
        required: function (this: any) { return this.type === 'mcq'; }
    },
    referenceAnswer: {
        type: String,
        required: function (this: any) { return this.type === 'descriptive'; }
    },
    subject: { type: String, required: true },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    points: { type: Number, default: 1 },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true
});

function arrayLimit(val: string[]) {
    if (!val) return true; // Handled by 'required' if type is mcq
    return val.length >= 2;
}

export default mongoose.model<IQuestion>('Question', QuestionSchema);
