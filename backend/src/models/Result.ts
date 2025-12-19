import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    examId: mongoose.Schema.Types.ObjectId;
    score: number;
    totalPoints: number;
    answers: {
        questionId: mongoose.Schema.Types.ObjectId;
        selectedOption: number;
        isCorrect: boolean;
        timeSpent: number; // in seconds
    }[];
    submittedAt: Date;
}

const ResultSchema: Schema = new Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
        timeSpent: { type: Number, default: 0 }
    }],
    submittedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Ensure only one result per student per exam
ResultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export default mongoose.model<IResult>('Result', ResultSchema);
