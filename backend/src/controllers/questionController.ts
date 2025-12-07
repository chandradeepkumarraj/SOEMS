import { Request, Response } from 'express';
import Question from '../models/Question';

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private (Teacher/Admin)
export const createQuestion = async (req: any, res: Response) => {
    try {
        const { text, options, correctAnswer, subject, difficulty } = req.body;

        const question = await Question.create({
            text,
            options,
            correctAnswer,
            subject,
            difficulty,
            creatorId: req.user._id
        });

        res.status(201).json(question);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private
export const getQuestions = async (req: Request, res: Response) => {
    try {
        const questions = await Question.find({});
        res.json(questions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get question by ID
// @route   GET /api/questions/:id
// @access  Private
export const getQuestionById = async (req: Request, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);
        if (question) {
            res.json(question);
        } else {
            res.status(404).json({ message: 'Question not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Teacher/Admin)
export const updateQuestion = async (req: Request, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);

        if (question) {
            question.text = req.body.text || question.text;
            question.options = req.body.options || question.options;
            question.correctAnswer = req.body.correctAnswer ?? question.correctAnswer;
            question.subject = req.body.subject || question.subject;
            question.difficulty = req.body.difficulty || question.difficulty;

            const updatedQuestion = await question.save();
            res.json(updatedQuestion);
        } else {
            res.status(404).json({ message: 'Question not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Teacher/Admin)
export const deleteQuestion = async (req: Request, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);

        if (question) {
            await question.deleteOne();
            res.json({ message: 'Question removed' });
        } else {
            res.status(404).json({ message: 'Question not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
