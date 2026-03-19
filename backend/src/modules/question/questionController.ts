import { Request, Response } from 'express';
import Question from '../../models/Question';
import Exam from '../../models/Exam';
import { generateQuestions } from '../ai/aiService';
import { z } from 'zod';

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private (Teacher/Admin)
export const createQuestion = async (req: any, res: Response) => {
    try {
        const schema = z.object({
            type: z.enum(['mcq', 'descriptive']).default('mcq'),
            text: z.string().min(5, 'Question text too short'),
            options: z.array(z.string()).optional(),
            correctAnswer: z.number().optional(),
            referenceAnswer: z.string().optional(),
            subject: z.string().min(2),
            difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
            imageUrl: z.string().nullable().optional(),
            optionImages: z.array(z.string()).optional()
        }).refine(data => {
            if (data.type === 'mcq') {
                return data.options && data.options.length >= 2 && data.correctAnswer !== undefined && data.correctAnswer < data.options.length;
            }
            return true;
        }, { message: "MCQ must have at least 2 options and a valid correct answer index." });

        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ message: 'Validation Failed', details: validation.error.errors });
        }

        const { text, options, correctAnswer, subject, difficulty, type, referenceAnswer, imageUrl, optionImages } = validation.data;

        const question = await Question.create({
            type,
            text,
            options,
            correctAnswer,
            referenceAnswer,
            subject,
            difficulty,
            imageUrl: imageUrl || null,
            optionImages: optionImages || [],
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
        // Only return questions created by the user or all if admin
        const query = (req as any).user.role === 'admin' ? {} : { creatorId: (req as any).user._id };
        const questions = await Question.find(query).sort({ createdAt: -1 });
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
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Authorization check: Admin or Creator
        if (question.creatorId.toString() !== (req as any).user._id.toString() && (req as any).user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this question' });
        }

        res.json(question);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Teacher/Admin)
export const updateQuestion = async (req: any, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Authorization check: Only creator or admin can update
        if (question.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this question' });
        }

        question.text = req.body.text || question.text;
        question.options = req.body.options || question.options;
        question.correctAnswer = req.body.correctAnswer ?? question.correctAnswer;
        question.subject = req.body.subject || question.subject;
        question.difficulty = req.body.difficulty || question.difficulty;
        if (req.body.imageUrl !== undefined) (question as any).imageUrl = req.body.imageUrl;
        if (req.body.optionImages !== undefined) (question as any).optionImages = req.body.optionImages;

        const updatedQuestion = await question.save();
        res.json(updatedQuestion);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Teacher/Admin)
export const deleteQuestion = async (req: any, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Authorization check: Only creator or admin can delete
        if (question.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this question' });
        }

        // Cascade: Remove this question from any exams that include it
        await Exam.updateMany(
            { questions: question._id },
            { $pull: { questions: question._id } }
        );

        await question.deleteOne();
        res.json({ message: 'Question removed and unlinked from exams' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate questions using AI (Ollama)
// @route   POST /api/questions/generate-ai
// @access  Private (Teacher/Admin)
export const generateWithAI = async (req: any, res: Response) => {
    try {
        const { subject, topic, count, difficulty, type } = req.body;

        if (!subject || !topic || !count) {
            return res.status(400).json({ message: 'Subject, topic, and count are required.' });
        }

        if (count > 30) {
            return res.status(400).json({ message: 'Maximum 30 questions can be generated at once.' });
        }

        const questions = await generateQuestions(
            subject,
            topic,
            parseInt(count),
            difficulty || 'medium',
            type || 'mcq'
        );

        res.json({ questions, count: questions.length });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'AI generation failed.' });
    }
};
