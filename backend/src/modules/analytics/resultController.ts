import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Result from '../../models/Result';
import { AuthRequest } from '../auth/authMiddleware';
import { generateImprovementReport } from '../ai/aiService';

// @desc    Get all results for the logged-in student
// @route   GET /api/results/my-results
// @access  Private (Student)
export const getMyResults = async (req: AuthRequest, res: Response) => {
    try {
        const results = await Result.find({ studentId: req.user._id })
            .populate('examId', 'title startTime duration')
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get result for the logged-in student for a specific exam
// @route   GET /api/results/exam/:examId/my-result
// @access  Private (Student)
export const getMyResultForExam = async (req: AuthRequest, res: Response) => {
    try {
        const result = await Result.findOne({ studentId: req.user._id, examId: req.params.examId })
            .sort({ submittedAt: -1 })
            .populate('examId', 'title description totalQuestions')
            .populate('answers.questionId', 'text options correctAnswer type');

        if (!result) {
            return res.status(404).json({ message: 'Result not found for this exam' });
        }
        res.json(result);
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
export const getResultById = async (req: AuthRequest, res: Response) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('examId', 'title description totalQuestions')
            .populate('answers.questionId', 'text options correctAnswer');

        if (result) {
            // Authorization Check
            if (req.user.role === 'student' && result.studentId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this result' });
            }
            res.json(result);
        } else {
            res.status(404).json({ message: 'Result not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get detailed analysis for a specific result
// @route   GET /api/results/:id/analysis
// @access  Private
export const getResultAnalysis = async (req: AuthRequest, res: Response) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('examId', 'title status isAdaptive adaptiveConfig duration')
            .populate('answers.questionId', 'text subject difficulty');

        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        // Authorization Check
        if (req.user.role === 'student' && result.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this analysis' });
        }

        // 1. Topic-wise Performance
        const topicStats: Record<string, { total: number, correct: number }> = {};

        result.answers.forEach((ans: any) => {
            if (!ans.questionId) return;
            const topic = (ans.questionId as any).subject?.trim() || 'General';
            if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
            topicStats[topic].total++;
            if (ans.isCorrect) topicStats[topic].correct++;
        });

        const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
            topic,
            accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
            totalQuestions: stats.total
        }));

        // 2. Peer Comparison & Rank (Optimized)
        const examObj = result.examId as any;
        const examId = examObj._id || examObj;
        const examStatus = examObj.status || 'published';
        const isClosed = examStatus === 'closed';

        // Get basic stats for the exam
        const examStatsArr = await Result.aggregate([
            { $match: { examId: new mongoose.Types.ObjectId(examId) } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgScore: { $avg: "$score" }
                }
            }
        ]);

        const totalExams = examStatsArr.length > 0 ? examStatsArr[0].count : 0;
        const examAverage = examStatsArr.length > 0 ? examStatsArr[0].avgScore : 0;

        // Calculate Rank (Competitive logic: count students who scored more, or same score with faster/earlier submission)
        const higherScorersCount = await Result.countDocuments({
            examId,
            $or: [
                { score: { $gt: result.score } },
                { score: result.score, submittedAt: { $lt: result.submittedAt } }
            ]
        });
        const classRank = higherScorersCount + 1;

        // Calculate Percentile (Percentage of students with strictly lower scores)
        const lowerScorersCount = await Result.countDocuments({
            examId,
            score: { $lt: result.score }
        });
        const percentile = totalExams > 0 ? (lowerScorersCount / totalExams) * 100 : 0;

        let peerGapQuestions: any[] = [];
        let adaptiveStats: any = null;

        if (examObj.isAdaptive) {
            adaptiveStats = {
                easy: { correct: 0, total: 0 },
                medium: { correct: 0, total: 0 },
                hard: { correct: 0, total: 0 }
            };
            result.answers.forEach((ans: any) => {
                if (!ans.questionId) return;
                const q = ans.questionId as any;
                if (q.difficulty) {
                    const diff = q.difficulty as 'easy' | 'medium' | 'hard';
                    if (adaptiveStats[diff]) {
                        adaptiveStats[diff].total++;
                        if (ans.isCorrect) adaptiveStats[diff].correct++;
                    }
                }
            });
        } else if (isClosed) {
            // 3. Questions missed by this student but correct for most others (>60%)
            // Optimized: Aggregate accuracy per question for ONLY the ones this student got wrong
            const wrongQuestionIds = result.answers
                .filter((ans: any) => !ans.isCorrect && ans.questionId)
                .map((ans: any) => new mongoose.Types.ObjectId((ans.questionId as any)._id || ans.questionId));

            if (wrongQuestionIds.length > 0) {
                const globalQuestionAccuracyArr = await Result.aggregate([
                    { $match: { examId: new mongoose.Types.ObjectId(examId) } },
                    { $unwind: "$answers" },
                    { $match: { "answers.questionId": { $in: wrongQuestionIds } } },
                    {
                        $group: {
                            _id: "$answers.questionId",
                            correctCount: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
                            totalCount: { $sum: 1 }
                        }
                    }
                ]);

                const accuracyMap = new Map();
                globalQuestionAccuracyArr.forEach(item => {
                    accuracyMap.set(item._id.toString(), item.correctCount / item.totalCount);
                });

                result.answers.forEach((ans: any) => {
                    if (!ans.isCorrect && ans.questionId) {
                        const qId = ((ans.questionId as any)._id || ans.questionId).toString();
                        const accuracy = accuracyMap.get(qId);
                        if (accuracy !== undefined && accuracy > 0.6) {
                            peerGapQuestions.push({
                                text: (ans.questionId as any).text || 'Question',
                                globalAccuracy: accuracy * 100
                            });
                        }
                    }
                });
            }
        }

        res.json({
            examTitle: examObj.title || 'Exam',
            examStatus,
            score: result.score,
            totalPoints: result.totalPoints,
            topicPerformance,
            examAverage,
            percentile: Math.round(percentile),
            totalParticipants: totalExams,
            classRank,
            peerGapQuestions,
            isInsightsAvailable: isClosed,
            isAdaptive: examObj.isAdaptive || false,
            adaptiveStats
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate a personal AI improvement report for the student
// @route   GET /api/results/my-improvement
// @access  Private (Student)
export const getMyImprovementReport = async (req: AuthRequest, res: Response) => {
    try {
        const results = await Result.find({ studentId: req.user._id })
            .populate('examId', 'title')
            .populate('answers.questionId', 'text subject difficulty')
            .sort({ submittedAt: -1 })
            .limit(10);

        if (results.length === 0) {
            return res.status(404).json({ message: 'No results found to generate report' });
        }

        const report = await generateImprovementReport(req.user.name, results);
        res.json({ report });

    } catch (error: any) {
        console.error('Improvement Report Error:', error);
        res.status(500).json({ message: error.message });
    }
};
