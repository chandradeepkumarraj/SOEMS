import express from 'express';
import { getUserProfile, updateUserProfile, getMyStudents } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/my-students', protect, getMyStudents);

export default router;
