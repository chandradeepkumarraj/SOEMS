import express from 'express';
import { getUserProfile, updateUserProfile, getMyStudents, getProctors } from './userController';
import { protect, teacher, admin } from '../auth/authModule';

const router = express.Router();

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/my-students', protect, teacher, getMyStudents);
router.get('/proctors', protect, teacher, getProctors);

export default router;
