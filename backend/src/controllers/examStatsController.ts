import { Request, Response } from 'express';
import Result from '../models/Result';
import Exam from '../models/Exam';

// @desc    Get exam statistics
// @route   GET /api/exams/:id/stats
// @access  Private (Teacher/Admin)
export const getExamStats = async (req: Request, res: Response) => {
    try {
        const examId = req.params.id;

        // Fetch exam details
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Fetch all results for this exam
        const results = await Result.find({ examId })
            .populate('studentId', 'name email')
            .populate('answers.questionId');

        const totalStudents = results.length;

        if (totalStudents === 0) {
            return res.json({
                exam: {
                    title: exam.title,
                    date: exam.startTime,
                    totalQuestions: exam.questions.length
                },
                totalStudents: 0,
                submitted: 0,
                avgScore: 0,
                passRate: 0,
                median: 0,
                highest: 0,
                lowest: 0,
                scoreDistribution: [],
                questionPerformance: []
            });
        }

        // Calculate statistics
        const scores = results.map(r => (r.score / r.totalPoints) * 100);
        const avgScore = scores.reduce((a, b) => a + b, 0) / totalStudents;
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);

        // Calculate median
        const sortedScores = [...scores].sort((a, b) => a - b);
        const median = sortedScores[Math.floor(totalStudents / 2)];

        // Calculate pass rate (assuming 60% is passing)
        const passRate = (scores.filter(s => s >= 60).length / totalStudents) * 100;

        // Score distribution
        const scoreDistribution = [
            { range: '90-100%', count: scores.filter(s => s >= 90).length, color: 'bg-green-500' },
            { range: '80-89%', count: scores.filter(s => s >= 80 && s < 90).length, color: 'bg-emerald-500' },
            { range: '70-79%', count: scores.filter(s => s >= 70 && s < 80).length, color: 'bg-blue-500' },
            { range: '60-69%', count: scores.filter(s => s >= 60 && s < 70).length, color: 'bg-yellow-500' },
            { range: '0-59%', count: scores.filter(s => s < 60).length, color: 'bg-red-500' },
        ].map(item => ({
            ...item,
            percentage: Math.round((item.count / totalStudents) * 100)
        }));

        // Question performance analysis
        const questionPerformance = exam.questions.map((question: any, index: number) => {
            const correctCount = results.filter(result => {
                const answer = result.answers.find((a: any) =>
                    a.questionId.toString() === question._id.toString()
                );
                return answer?.isCorrect;
            }).length;

            const correctPercentage = (correctCount / totalStudents) * 100;

            return {
                id: index + 1,
                questionId: question._id,
                text: question.text,
                correct: Math.round(correctPercentage),
                difficulty: question.difficulty || 'Medium'
            };
        });

        res.json({
            exam: {
                title: exam.title,
                date: exam.startTime,
                totalQuestions: exam.questions.length
            },
            totalStudents,
            submitted: totalStudents,
            avgScore: Math.round(avgScore * 10) / 10,
            passRate: Math.round(passRate),
            median: Math.round(median),
            highest: Math.round(highest),
            lowest: Math.round(lowest),
            scoreDistribution,
            questionPerformance
        });
    } catch (error: any) {
        console.error('Error fetching exam stats:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get teacher dashboard statistics
// @route   GET /api/exams/teacher/stats
// @access  Private (Teacher)
export const getTeacherDashboardStats = async (req: any, res: Response) => {
    try {
        const teacherId = req.user._id;

        // 1. Get all exams created by this teacher
        const exams = await Exam.find({ creatorId: teacherId });
        const examIds = exams.map(e => e._id);

        if (examIds.length === 0) {
            return res.json({
                totalStudents: 0,
                avgScore: 0,
                totalExams: 0
            });
        }

        // 2. Get all results for these exams
        const results = await Result.find({ examId: { $in: examIds } });

        // 3. Calculate Stats

        // Total unique students (students who submitted)
        const uniqueStudents = new Set(results.map(r => r.studentId.toString()));
        const totalStudents = uniqueStudents.size;

        // Avg Score across all submissions
        // weighted by total points? or just average of percentages? Average of percentages is usually better for mixed exams.
        let totalPercentage = 0;
        if (results.length > 0) {
            const percentages = results.map(r => (r.score / r.totalPoints) * 100);
            totalPercentage = percentages.reduce((a, b) => a + b, 0);
        }

        const avgScore = results.length > 0 ? totalPercentage / results.length : 0;

        res.json({
            totalStudents,
            avgScore: Math.round(avgScore),
            totalExams: exams.length
        });

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: error.message });
    }
};
