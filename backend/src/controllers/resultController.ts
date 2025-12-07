import { Request, Response } from 'express';
import Result from '../models/Result';

// @desc    Get all results for the logged-in student
// @route   GET /api/results/my-results
// @access  Private (Student)
export const getMyResults = async (req: any, res: Response) => {
    try {
        const results = await Result.find({ studentId: req.user._id })
            .populate('examId', 'title startTime duration')
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all results for a specific exam
// @route   GET /api/results/exam/:examId
// @access  Private (Teacher/Admin)
export const getResultsByExam = async (req: Request, res: Response) => {
    try {
        const results = await Result.find({ examId: req.params.examId })
            .populate('studentId', 'name email')
            .sort({ score: -1 });
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get specific result by ID
// @route   GET /api/results/:id
// @access  Private
export const getResultById = async (req: Request, res: Response) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('examId', 'title description totalQuestions') // Assuming totalQuestions or details needed
            .populate('answers.questionId', 'text options correctAnswer');

        if (result) {
            res.json(result);
        } else {
            res.status(404).json({ message: 'Result not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
