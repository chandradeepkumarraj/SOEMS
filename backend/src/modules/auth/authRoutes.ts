import express from 'express';
import { loginUser, setupAdminRecovery, resetAdminPassword, getMe, getMaintenanceStatus } from './authController';
import { protect, admin } from './authMiddleware';

const router = express.Router();

// router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/maintenance-status', getMaintenanceStatus);
router.post('/setup-recovery', protect, admin, setupAdminRecovery);
router.post('/reset-admin-password', resetAdminPassword);

export default router;
