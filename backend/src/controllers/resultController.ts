import { Request, Response } from 'express';
import Result from '../models/Result';
import { AuthRequest } from '../middleware/authMiddleware';

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
            .populate('examId', 'title status')
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

        // 2. Peer Comparison & Rank
        const examObj = result.examId as any;
        const examId = examObj._id || examObj;
        const examStatus = examObj.status || 'published';
        const isClosed = examStatus === 'closed';

        const allResultsForExam = await Result.find({ examId })
            .populate('answers.questionId', 'text')
            .sort({ score: -1, submittedAt: 1 })
            .lean();

        const totalExams = allResultsForExam.length;
        const totalScoreSum = allResultsForExam.reduce((sum, r) => sum + r.score, 0);
        const examAverage = totalExams > 0 ? (totalScoreSum / totalExams) : 0;

        // Calculate Rank and Percentile
        const rankIndex = allResultsForExam.findIndex(r => r._id.toString() === result._id.toString());
        const classRank = rankIndex !== -1 ? rankIndex + 1 : null;
        const studentsBeaten = allResultsForExam.filter(r => r.score < result.score).length;
        const percentile = totalExams > 0 ? (studentsBeaten / totalExams) * 100 : 0;

        let peerGapQuestions: any[] = [];
        if (isClosed) {
            // 3. Questions missed by this student but correct for most others (>60%)
            const questionPassRates: Record<string, { correct: number, total: number }> = {};

            allResultsForExam.forEach(res => {
                res.answers.forEach(ans => {
                    if (!ans.questionId) return;
                    const qId = (ans.questionId as any)._id ? (ans.questionId as any)._id.toString() : ans.questionId.toString();
                    if (!questionPassRates[qId]) questionPassRates[qId] = { correct: 0, total: 0 };
                    questionPassRates[qId].total++;
                    if (ans.isCorrect) questionPassRates[qId].correct++;
                });
            });

            result.answers.forEach((ans: any) => {
                if (!ans.isCorrect && ans.questionId) {
                    const qId = (ans.questionId as any)._id ? (ans.questionId as any)._id.toString() : ans.questionId.toString();
                    const stats = questionPassRates[qId];
                    if (stats && (stats.correct / stats.total) > 0.6) {
                        peerGapQuestions.push({
                            text: (ans.questionId as any).text || 'Question',
                            globalAccuracy: (stats.correct / stats.total) * 100
                        });
                    }
                }
            });
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
            isInsightsAvailable: isClosed
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
