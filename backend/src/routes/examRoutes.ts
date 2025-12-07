import express from 'express';
import {
    createExam,
    getExams,
    getExamById,
    deleteExam,
    submitExam,
    updateExam
} from '../controllers/examController';
import { getExamStats, getTeacherDashboardStats } from '../controllers/examStatsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, createExam)
    .get(protect, getExams);

router.route('/teacher-stats')
    .get(protect, getTeacherDashboardStats);

router.route('/:id')
    .get(protect, getExamById)
    .put(protect, updateExam)
    .delete(protect, deleteExam);

router.route('/:id/stats')
    .get(protect, getExamStats);

router.route('/:id/submit')
    .post(protect, submitExam);

export default router;
