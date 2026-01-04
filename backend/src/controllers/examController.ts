import { Request, Response } from 'express';
import Exam from '../models/Exam';
import Result from '../models/Result';
import Question from '../models/Question';
import ExamSession from '../models/ExamSession';
import User from '../models/User';
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

        // 1. Check if already submitted
        const existingResult = await Result.findOne({ studentId, examId });
        if (existingResult) {
            return res.status(400).json({ message: 'Exam already submitted' });
        }

        // 2. Fetch Exam and its Questions
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // 3. Calculate Score
        let score = 0;
        let totalPoints = 0;
        const processedAnswers = [];

        const questionMap = new Map();
        (exam.questions as any[]).forEach(q => {
            questionMap.set(q._id.toString(), q);
        });

        for (const ans of answers) {
            const question = questionMap.get(ans.questionId);
            if (question) {
                const isCorrect = question.correctAnswer === ans.selectedOption;
                if (isCorrect) score += 1;
                processedAnswers.push({
                    questionId: ans.questionId,
                    selectedOption: ans.selectedOption,
                    isCorrect,
                    timeSpent: ans.timeSpent || 0
                });
            }
        }

        totalPoints = exam.questions.length;

        // 4. Save Result
        const result = await Result.create({
            studentId,
            examId,
            score,
            totalPoints,
            answers: processedAnswers
        });

        // 5. Update and Close Session
        await ExamSession.findOneAndUpdate(
            { studentId, examId },
            { status: 'completed' }
        );

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

// @desc    Start or resume exam session
// @route   POST /api/exams/start/:id
// @access  Private
export const startExam = async (req: any, res: Response) => {
    try {
        const { id: examId } = req.params;
        const studentId = req.user._id;

        // 1. Check if already submitted
        const result = await Result.findOne({ studentId, examId });
        if (result) {
            return res.status(400).json({ message: 'You have already appeared for this exam.' });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found.' });
        }

        // 2. Check if expired
        const now = new Date();
        if (now > exam.endTime) {
            return res.status(400).json({ message: 'This exam has expired.' });
        }

        // 3. Check for existing session
        let session = await ExamSession.findOne({ studentId, examId });

        if (session) {
            if (session.status === 'completed') {
                return res.status(400).json({ message: 'You have already completed this exam.' });
            }
            return res.json({
                ...session.toObject(),
                serverTime: new Date()
            });
        }

        // 4. Create new session
        session = await ExamSession.create({
            studentId,
            examId,
            startTime: now,
            lastSyncTime: now,
            answers: {},
            timeSpent: {},
            flagged: {},
            status: 'in-progress'
        });

        res.status(201).json({
            ...session.toObject(),
            serverTime: new Date()
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update exam session progress
// @route   POST /api/exams/progress/:id
// @access  Private
export const updateSessionProgress = async (req: any, res: Response) => {
    try {
        const { id: examId } = req.params;
        const studentId = req.user._id;
        const { answers, timeSpent, flagged } = req.body;

        const session = await ExamSession.findOneAndUpdate(
            { studentId, examId, status: 'in-progress' },
            {
                $set: {
                    answers: answers || {},
                    timeSpent: timeSpent || {},
                    flagged: flagged || {},
                    lastSyncTime: new Date()
                }
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ message: 'Active session not found.' });
        }

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ... (existing exports)

// @route   POST /api/exams
// @access  Private (Teacher/Admin)
export const createExam = async (req: any, res: Response) => {
    try {
        const { title, description, questions, duration, startTime, endTime, status, allowedGroups, allowedSubgroups, proctoringConfig } = req.body;

        const exam = await Exam.create({
            title,
            description,
            questions,
            duration,
            startTime,
            endTime,
            status: status || 'draft',
            allowedGroups: allowedGroups || [],
            allowedSubgroups: allowedSubgroups || [],
            proctoringConfig,
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
export const getExams = async (req: any, res: Response) => {
    try {
        let query: any = {};

        // If user is a student, filter exams based on their group/subgroup
        if (req.user && req.user.role === 'student') {
            query.status = 'published';
            query.endTime = { $gt: new Date() }; // Only show non-expired exams to students

            // Exam is visible if:
            // 1. allowedGroups is empty (public)
            // 2. OR student's groupId is in allowedGroups
            const groupFilter = {
                $or: [
                    { allowedGroups: { $exists: true, $size: 0 } },
                    { allowedGroups: req.user.groupId }
                ]
            };

            // AND if allowedSubgroups is specified, student must be in it
            const subgroupFilter = {
                $or: [
                    { allowedSubgroups: { $exists: true, $size: 0 } },
                    { allowedSubgroups: req.user.subgroupId }
                ]
            };

            query.$and = [groupFilter, subgroupFilter];
        }

        const exams = await Exam.find(query).populate('creatorId', 'name email').lean();

        // Populate submission count and student status
        const examsWithStatus = await Promise.all(exams.map(async (exam: any) => {
            const candidatesCount = await Result.countDocuments({ examId: exam._id });

            let studentStatus = 'not-started';
            if (req.user && req.user.role === 'student') {
                const result = await Result.findOne({ studentId: req.user._id, examId: exam._id });
                if (result) {
                    studentStatus = 'completed';
                } else {
                    const session = await ExamSession.findOne({ studentId: req.user._id, examId: exam._id });
                    if (session && session.status === 'in-progress') {
                        studentStatus = 'in-progress';
                    }
                }
            }

            return {
                ...exam,
                candidatesCount,
                studentStatus
            };
        }));

        res.json(examsWithStatus);
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

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check ownership
        if (exam.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this exam' });
        }

        const {
            title,
            description,
            questions,
            duration,
            startTime,
            endTime,
            status,
            resultsPublished,
            allowedGroups,
            allowedSubgroups,
            proctoringConfig
        } = req.body;

        exam.title = title || exam.title;
        exam.description = description !== undefined ? description : exam.description;
        exam.questions = questions || exam.questions;
        exam.duration = duration || exam.duration;
        exam.startTime = startTime || exam.startTime;
        exam.endTime = endTime || exam.endTime;
        exam.status = status || exam.status;
        exam.resultsPublished = resultsPublished !== undefined ? resultsPublished : exam.resultsPublished;
        exam.allowedGroups = allowedGroups || exam.allowedGroups;
        exam.allowedSubgroups = allowedSubgroups || exam.allowedSubgroups;
        exam.proctoringConfig = proctoringConfig || exam.proctoringConfig;

        const updatedExam = await exam.save();
        res.json(updatedExam);
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
            // Cascade: Delete Sessions and Results associated with this exam
            await ExamSession.deleteMany({ examId: exam._id });
            await Result.deleteMany({ examId: exam._id });

            await exam.deleteOne();
            res.json({ message: 'Exam and all associated sessions/results removed' });
        } else {
            res.status(404).json({ message: 'Exam not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manually end an exam
// @route   POST /api/exams/:id/end
// @access  Private (Teacher/Admin)
export const endExam = async (req: any, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check ownership
        if (req.user.role !== 'admin' && exam.creatorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        exam.status = 'closed';
        exam.endTime = new Date(); // End now
        await exam.save();

        // Notify via Socket
        try {
            const io = getIO();
            io.to(exam._id.toString()).emit('exam-closed-manually', { examId: exam._id });
        } catch (e) {
            console.error('Socket emission failed:', e);
        }

        res.json({ message: 'Exam ended manually' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get live exam analytics
// @route   GET /api/exams/:id/analytics
// @access  Private (Teacher/Admin)
export const getExamAnalytics = async (req: any, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // 1. Calculate total eligible students
        let eligibleQuery: any = { role: 'student' };
        if (exam.allowedGroups && exam.allowedGroups.length > 0) {
            eligibleQuery.groupId = { $in: exam.allowedGroups };
        }
        if (exam.allowedSubgroups && exam.allowedSubgroups.length > 0) {
            eligibleQuery.subgroupId = { $in: exam.allowedSubgroups };
        }

        const totalEligibleCount = await User.countDocuments(eligibleQuery);

        // 2. Active students (in-progress sessions)
        const activeCount = await ExamSession.countDocuments({
            examId: exam._id,
            status: 'in-progress'
        });

        // 3. Detailed analysis of results - POPULATE studentId to avoid N+1 queries
        const allResults = await Result.find({ examId: exam._id })
            .populate('studentId', 'name')
            .populate('answers.questionId', 'text subject difficulty')
            .lean();

        const finishedCount = allResults.length;

        const questionStats: Record<string, {
            id: string,
            text: string,
            correctCount: number,
            totalAnswered: number,
            avgTime: number,
            fastestCorrect?: { studentName: string, time: number }
        }> = {};

        // Initialize questionStats from exam questions
        const examQuestions = await Question.find({ _id: { $in: exam.questions } }).lean();
        examQuestions.forEach(q => {
            questionStats[q._id.toString()] = {
                id: q._id.toString(),
                text: q.text,
                correctCount: 0,
                totalAnswered: 0,
                avgTime: 0
            };
        });

        let totalScoreSum = 0;
        const allScores: number[] = [];
        const scoreDistribution = [
            { range: '0-20%', count: 0 },
            { range: '21-40%', count: 0 },
            { range: '41-60%', count: 0 },
            { range: '61-80%', count: 0 },
            { range: '81-100%', count: 0 }
        ];

        let topPerformer: any = null;
        let globalFastestCorrect: any = null;

        // Aggregate stats from all results (results are already populated)
        for (const resDoc of allResults) {
            const studentName = (resDoc.studentId as any)?.name || 'Unknown';
            const percentage = (resDoc.score / (resDoc.totalPoints || 1)) * 100;
            totalScoreSum += resDoc.score;
            allScores.push(resDoc.score);

            // Score Distribution
            if (percentage <= 20) scoreDistribution[0].count++;
            else if (percentage <= 40) scoreDistribution[1].count++;
            else if (percentage <= 60) scoreDistribution[2].count++;
            else if (percentage <= 80) scoreDistribution[3].count++;
            else scoreDistribution[4].count++;

            // Top Performer Check
            const totalTime = resDoc.answers.reduce((acc: number, curr: any) => acc + (curr.timeSpent || 0), 0);
            if (!topPerformer || resDoc.score > topPerformer.score || (resDoc.score === topPerformer.score && totalTime < topPerformer.totalTime)) {
                topPerformer = {
                    name: studentName,
                    score: resDoc.score,
                    totalPoints: resDoc.totalPoints,
                    totalTime
                };
            }

            for (const ans of resDoc.answers) {
                if (!ans.questionId) continue;
                const qId = (ans.questionId as any)._id ? (ans.questionId as any)._id.toString() : ans.questionId.toString();
                if (questionStats[qId]) {
                    questionStats[qId].totalAnswered++;
                    if (ans.isCorrect) {
                        questionStats[qId].correctCount++;

                        const responder = {
                            studentName,
                            time: ans.timeSpent,
                            questionText: questionStats[qId].text
                        };

                        // Track fastest correct responder per question
                        if (!questionStats[qId].fastestCorrect || (ans.timeSpent > 0 && ans.timeSpent < questionStats[qId].fastestCorrect!.time)) {
                            questionStats[qId].fastestCorrect = responder;
                        }

                        // Track global fastest correct responder
                        if (ans.timeSpent > 0 && (!globalFastestCorrect || ans.timeSpent < globalFastestCorrect.time)) {
                            globalFastestCorrect = responder;
                        }
                    }
                    questionStats[qId].avgTime += ans.timeSpent || 0;
                }
            }
        }

        // Finalize stats
        const questionAnalysis = Object.values(questionStats).map(q => ({
            ...q,
            accuracy: q.totalAnswered > 0 ? (q.correctCount / q.totalAnswered) * 100 : 0,
            notAttendedBy: finishedCount - q.totalAnswered,
            avgTime: q.totalAnswered > 0 ? (q.avgTime / q.totalAnswered) : 0
        }));

        // Insights
        const sortedAnalysis = [...questionAnalysis].sort((a, b) => a.accuracy - b.accuracy);
        const toughestQuestion = sortedAnalysis.length > 0 ? sortedAnalysis[0] : null;
        const easiestQuestion = sortedAnalysis.length > 0 ? sortedAnalysis[sortedAnalysis.length - 1] : null;

        const averageScore = finishedCount > 0 ? totalScoreSum / finishedCount : 0;

        // Median Score
        let medianScore = 0;
        if (allScores.length > 0) {
            allScores.sort((a, b) => a - b);
            const mid = Math.floor(allScores.length / 2);
            medianScore = allScores.length % 2 !== 0 ? allScores[mid] : (allScores[mid - 1] + allScores[mid]) / 2;
        }

        const notAttendedCount = Math.max(0, totalEligibleCount - activeCount - finishedCount);

        res.json({
            examId: exam._id,
            title: exam.title,
            status: exam.status,
            totalEligible: totalEligibleCount,
            active: activeCount,
            finished: finishedCount,
            notAttended: notAttendedCount,
            averageScore,
            medianScore,
            scoreDistribution,
            topPerformer,
            questionAnalysis,
            globalFastestCorrect,
            toughestQuestion: toughestQuestion ? {
                text: toughestQuestion.text,
                accuracy: toughestQuestion.accuracy,
                notAttendedCount: toughestQuestion.notAttendedBy
            } : null,
            easiestQuestion: easiestQuestion ? {
                text: easiestQuestion.text,
                accuracy: easiestQuestion.accuracy
            } : null
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
