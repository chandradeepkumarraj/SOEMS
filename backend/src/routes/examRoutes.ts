import express from 'express';
import {
    createExam,
    getExams,
    getExamById,
    deleteExam,
    submitExam,
    updateExam,
    startExam,
    updateSessionProgress,
    endExam,
    getExamAnalytics,
    logViolation,
    getExamViolations,
    getActiveSessions,
    getGlobalProctorStats,
    getCheatingAnalysis,
    downloadCheatingReport,
    resumeStudentSession
} from '../controllers/examController';
import { getExamStats, getTeacherDashboardStats } from '../controllers/examStatsController';
import { protect, teacher, proctor, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, teacher, createExam)
    .get(protect, getExams);

router.get('/proctor/global-stats', protect, proctor, getGlobalProctorStats);
router.get('/proctor/cheating-analysis', protect, proctor, getCheatingAnalysis);
router.get('/:id/cheating-report', protect, proctor, downloadCheatingReport);
router.post('/:id/resume/:studentId', protect, proctor, resumeStudentSession);

router.post('/start/:id', protect, startExam);
router.post('/progress/:id', protect, updateSessionProgress);
router.post('/:id/end', protect, teacher, endExam);
router.get('/:id/analytics', protect, teacher, getExamAnalytics);
router.post('/:id/violation', protect, logViolation);
router.get('/:id/violations', protect, proctor, getExamViolations);
router.get('/:id/active-sessions', protect, proctor, getActiveSessions);

router.route('/teacher-stats')
    .get(protect, getTeacherDashboardStats);

router.route('/:id')
    .get(protect, getExamById)
    .put(protect, teacher, updateExam)
    .delete(protect, teacher, deleteExam);

router.route('/:id/stats')
    .get(protect, getExamStats);

router.route('/:id/submit')
    .post(protect, submitExam);

export default router;
