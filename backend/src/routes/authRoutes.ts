import express from 'express';
import { registerUser, loginUser, setupAdminRecovery, resetAdminPassword } from '../controllers/authController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/setup-recovery', protect, admin, setupAdminRecovery);
router.post('/reset-admin-password', resetAdminPassword);

export default router;
