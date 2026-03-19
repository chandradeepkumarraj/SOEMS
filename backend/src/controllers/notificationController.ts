import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * @desc    Get user's notifications (sorted by newest first)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 for performance

        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Mark a specific notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: (req as any).user?._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        await Notification.updateMany(
            { recipient: (req as any).user?._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Clear (delete) all notifications for the user
 * @route   DELETE /api/notifications/clear
 * @access  Private
 */
export const clearAllNotifications = async (req: Request, res: Response) => {
    try {
        await Notification.deleteMany({ recipient: (req as any).user?._id });
        res.json({ message: 'Notification history cleared successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Helper utility function to create a notification internally from other controllers
 */
export const createNotification = async (recipientId: string, title: string, message: string, type: 'system' | 'assignment' | 'alert' | 'message' = 'system') => {
    try {
        const notification = new Notification({
            recipient: recipientId,
            title,
            message,
            type
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Failed to create internal notification:', error);
    }
};
