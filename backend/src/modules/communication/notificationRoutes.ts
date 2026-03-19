import express from 'express';
import { protect } from '../auth/authMiddleware';
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
} from './notificationController';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/clear', clearAllNotifications);

export default router;
