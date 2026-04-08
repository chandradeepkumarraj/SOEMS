import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemLock extends Document {
    key: string;
    lockedAt: Date;
    expiresAt: Date;
    lockedBy: string; // Worker or Process ID
}

const systemLockSchema = new Schema<ISystemLock>({
    key: { type: String, required: true, unique: true },
    lockedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    lockedBy: { type: String, required: true }
});

// Auto-delete expired locks using TTL index
systemLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISystemLock>('SystemLock', systemLockSchema);
