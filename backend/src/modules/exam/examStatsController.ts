import { Request, Response } from 'express';
import { Result, Exam } from '../../models/modelsModule';
import { Parser } from 'json2csv';
import { askAI } from '../ai/aiModule';

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

// @desc    Export exam results to CSV
// @route   GET /api/exams/:id/export
// @access  Private (Teacher/Admin)
export const exportExamResultsCSV = async (req: Request, res: Response) => {
    try {
        const examId = req.params.id;
        const results = await Result.find({ examId })
            .populate('studentId', 'name email rollNo')
            .sort({ score: -1 });

        if (results.length === 0) {
            return res.status(404).json({ message: 'No results found for this exam' });
        }

        const fields = [
            { label: 'Student Name', value: 'studentId.name' },
            { label: 'Email', value: 'studentId.email' },
            { label: 'Roll Number', value: 'studentId.rollNo' },
            { label: 'Score', value: 'score' },
            { label: 'Total Points', value: 'totalPoints' },
            { label: 'Percentage', value: (row: any) => ((row.score / row.totalPoints) * 100).toFixed(2) + '%' },
            { label: 'Violations', value: 'violations' },
            { label: 'Submitted At', value: (row: any) => new Date(row.submittedAt).toLocaleString() }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(results);

        res.header('Content-Type', 'text/csv');
        res.attachment(`Exam_Results_${examId}.csv`);
        return res.send(csv);

    } catch (error: any) {
        console.error('CSV Export Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate class-wide AI insight narrative
// @route   GET /api/exams/:id/ai-insight
// @access  Private (Teacher/Admin)
export const generateClassAIInsight = async (req: Request, res: Response) => {
    try {
        const examId = req.params.id;
        const exam = await Exam.findById(examId).populate('questions');
        const results = await Result.find({ examId }).populate('answers.questionId');

        if (!exam || results.length === 0) {
            return res.status(404).json({ message: 'Insufficient data for AI insight' });
        }

        // Aggregate statistics for AI
        const totalStudents = results.length;
        const avgScore = results.reduce((acc, r) => acc + (r.score / r.totalPoints) * 100, 0) / totalStudents;

        const questionStats = exam.questions.map((q: any) => {
            const correctCount = results.filter(r => {
                const ans = r.answers.find((a: any) => a.questionId._id.toString() === q._id.toString());
                return ans?.isCorrect;
            }).length;
            return {
                text: q.text,
                accuracy: (correctCount / totalStudents) * 100
            };
        });

        const prompt = `
        ### MISSION
        You are a Pedagogical Data Analyst. Analyze the class-wide performance for the exam "${exam.title}" and provide a professional, constructive narrative for the teacher.
        
        ### DATA
        - Total Students: ${totalStudents}
        - Average Percentage Score: ${avgScore.toFixed(1)}%
        - Question Accuracy Breakdown: ${JSON.stringify(questionStats)}
        
        ### REQUIREMENTS
        1. Identify the top 2 concepts students mastered.
        2. Identify the top 2 concepts where students struggled most.
        3. Provide 3 specific teaching recommendations for the next lecture.
        Keep the summary between 200-300 words. Use a professional and encouraging tone.
        `;

        const narrative = await askAI(prompt, "You are a senior educational consultant. Provide deep insights based on the statistics provided.");

        res.json({ narrative });

    } catch (error: any) {
        console.error('AI Insight Error:', error);
        res.status(500).json({ message: error.message });
    }
};
