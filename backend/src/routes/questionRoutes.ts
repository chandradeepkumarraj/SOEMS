import express from 'express';
import {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion
} from '../controllers/questionController';
import { protect, teacher } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, teacher, createQuestion)
    .get(protect, teacher, getQuestions);

router.route('/:id')
    .get(protect, teacher, getQuestionById)
    .put(protect, teacher, updateQuestion)
    .delete(protect, teacher, deleteQuestion);

export default router;
