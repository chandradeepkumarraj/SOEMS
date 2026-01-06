import mongoose, { Document, Schema } from 'mongoose';

export interface IViolation extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    examId: mongoose.Schema.Types.ObjectId;
    type: string;
    message: string;
    timestamp: Date;
}

const ViolationSchema: Schema = new Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export default mongoose.model<IViolation>('Violation', ViolationSchema);
