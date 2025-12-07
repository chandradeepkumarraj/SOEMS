import { Request, Response } from 'express';
import Exam from '../models/Exam';
import Result from '../models/Result';
import Question from '../models/Question';
import { getIO } from '../socket';

// ... (existing imports and functions)

// @desc    Submit exam and calculate score
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
export const submitExam = async (req: any, res: Response) => {
    try {
        const { answers } = req.body; // Array of { questionId, selectedOption }
        const examId = req.params.id;
        const studentId = req.user._id;

        // 1. Fetch Exam and its Questions
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // 2. Calculate Score
        let score = 0;
        let totalPoints = 0;
        const processedAnswers = [];

        // Create a map of questions for faster lookup
        const questionMap = new Map();
        (exam.questions as any[]).forEach(q => {
            questionMap.set(q._id.toString(), q);
        });

        for (const ans of answers) {
            const question = questionMap.get(ans.questionId);
            if (question) {
                const isCorrect = question.correctAnswer === ans.selectedOption;
                if (isCorrect) {
                    score += 1; // Assuming 1 point per question for now
                }
                totalPoints += 1;

                processedAnswers.push({
                    questionId: ans.questionId,
                    selectedOption: ans.selectedOption,
                    isCorrect
                });
            }
        }

        // Handle unanswered questions (if any) - Optional, for now we assume totalPoints = exam.questions.length
        totalPoints = exam.questions.length;

        // 3. Save Result
        const result = await Result.create({
            studentId,
            examId,
            score,
            totalPoints,
            answers: processedAnswers
        });

        // Notify via Socket
        try {
            const io = getIO();
            io.to(examId).emit('student-submitted-exam', { studentId, examId, score });
        } catch (e) {
            console.error('Socket emission failed:', e);
        }

        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ... (existing exports)

// @route   POST /api/exams
// @access  Private (Teacher/Admin)
export const createExam = async (req: any, res: Response) => {
    try {
        console.log('Creating exam with body:', req.body);
        const { title, description, questions, duration, startTime, endTime, status } = req.body;

        const exam = await Exam.create({
            title,
            description,
            questions,
            duration,
            startTime,
            endTime,
            status: status || 'draft',
            creatorId: req.user._id
        });

        res.status(201).json(exam);
    } catch (error: any) {
        console.error('Error creating exam:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req: Request, res: Response) => {
    try {
        const exams = await Exam.find({}).populate('creatorId', 'name email').lean();

        // Populate submission count
        const examsWithCount = await Promise.all(exams.map(async (exam: any) => {
            const count = await Result.countDocuments({ examId: exam._id });
            return { ...exam, candidatesCount: count };
        }));

        res.json(examsWithCount);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = async (req: Request, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('questions')
            .populate('creatorId', 'name email');

        if (exam) {
            res.json(exam);
        } else {
            res.status(404).json({ message: 'Exam not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Teacher/Admin)
export const updateExam = async (req: any, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (exam) {
            // Check ownership
            if (exam.creatorId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            exam.title = req.body.title || exam.title;
            exam.description = req.body.description || exam.description;
            if (req.body.questions) exam.questions = req.body.questions;
            if (req.body.duration) exam.duration = req.body.duration;
            if (req.body.startTime) exam.startTime = req.body.startTime;
            if (req.body.endTime) exam.endTime = req.body.endTime;
            if (req.body.status) exam.status = req.body.status;

            const updatedExam = await exam.save();
            res.json(updatedExam);
        } else {
            res.status(404).json({ message: 'Exam not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Teacher/Admin)
export const deleteExam = async (req: Request, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (exam) {
            await exam.deleteOne();
            res.json({ message: 'Exam removed' });
        } else {
            res.status(404).json({ message: 'Exam not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
