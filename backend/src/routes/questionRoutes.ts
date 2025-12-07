import express from 'express';
import {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion
} from '../controllers/questionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, createQuestion)
    .get(protect, getQuestions);

router.route('/:id')
    .get(protect, getQuestionById)
    .put(protect, updateQuestion)
    .delete(protect, deleteQuestion);

export default router;
