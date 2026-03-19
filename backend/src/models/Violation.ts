import mongoose, { Document, Schema } from 'mongoose';

export interface IViolation extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    examId: mongoose.Schema.Types.ObjectId;
    type: string;
    message: string;
    snapshot?: string; // Base64-encoded JPEG snapshot from webcam at violation time
    transcript?: string; // Voice-to-text transcription from Web Speech API
    timestamp: Date;
}

const ViolationSchema: Schema = new Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    snapshot: { type: String }, // Optional evidence image
    transcript: { type: String }, // Optional voice transcript evidence
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Compound index for fast lookups by student+exam and rate-limit checks (sorted by timestamp)
ViolationSchema.index({ studentId: 1, examId: 1, timestamp: -1 });

export default mongoose.model<IViolation>('Violation', ViolationSchema);
