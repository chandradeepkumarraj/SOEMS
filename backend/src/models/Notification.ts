import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    type: 'system' | 'assignment' | 'alert' | 'message';
    title: string;
    message: string;
    isRead: boolean;
    relatedId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['system', 'assignment', 'alert', 'message'],
        default: 'system'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: Schema.Types.ObjectId
    }
}, {
    timestamps: true
});

// TTL Index: Automatically expire notifications 7 days (604800 seconds) after creation
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
