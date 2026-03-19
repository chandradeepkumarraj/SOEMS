import express from 'express';
import { getUserProfile, updateUserProfile, getMyStudents, getProctors } from '../controllers/userController';
import { protect, teacher, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/my-students', protect, teacher, getMyStudents);
router.get('/proctors', protect, teacher, getProctors);

export default router;
