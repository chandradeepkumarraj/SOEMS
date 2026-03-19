import express from 'express';
import { loginUser, setupAdminRecovery, resetAdminPassword, getMe } from '../controllers/authController';
import { getMaintenanceStatus } from '../controllers/systemConfigController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/setup-recovery', protect, admin, setupAdminRecovery);
router.post('/reset-admin-password', resetAdminPassword);
router.get('/maintenance-status', getMaintenanceStatus);

export default router;
