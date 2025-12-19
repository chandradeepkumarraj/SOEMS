import express from 'express';
import { getMyResults, getResultById, getResultsByExam, getResultAnalysis } from '../controllers/resultController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/my-results')
    .get(protect, getMyResults);

router.route('/exam/:examId')
    .get(protect, getResultsByExam);

router.route('/:id/analysis')
    .get(protect, getResultAnalysis);

router.route('/:id')
    .get(protect, getResultById);

export default router;
