import Exam from '../models/Exam';
import ExamSession from '../models/ExamSession';
import Result from '../models/Result';
import Question from '../models/Question';
import { getIO } from '../socket';

/**
 * Periodically checks for expired exams and finalizes them.
 * Auto-submits any in-progress sessions.
 */
export const startExamExpirationWorker = () => {
    // Check every 1 minute
    setInterval(async () => {
        try {
            const now = new Date();

            // 1. Find published exams that reached endTime but results not yet published
            const expiredExams = await Exam.find({
                status: 'published',
                endTime: { $lte: now },
                resultsPublished: false
            }).populate('questions');

            for (const exam of expiredExams) {
                console.log(`Finalizing expired exam: ${exam.title} (${exam._id})`);

                // 2. Find all in-progress sessions for this exam
                const pendingSessions = await ExamSession.find({
                    examId: exam._id,
                    status: 'in-progress'
                });

                for (const session of pendingSessions) {
                    try {
                        // Mongoose Map to plain object for easier iteration if needed
                        const answers = session.answers;

                        // Calculate score using the same logic as submitExam
                        let score = 0;
                        const processedAnswers: any[] = [];
                        const questionMap = new Map();
                        (exam.questions as any[]).forEach(q => {
                            questionMap.set(q._id.toString(), q);
                        });

                        // session.answers is a Mongoose Map
                        session.answers.forEach((optIdx, qId) => {
                            const question = questionMap.get(qId);
                            if (question) {
                                const isCorrect = question.correctAnswer === optIdx;
                                if (isCorrect) score += 1;
                                processedAnswers.push({
                                    questionId: qId,
                                    selectedOption: optIdx,
                                    isCorrect
                                });
                            }
                        });

                        // Create Result (if doesn't exist)
                        const existingResult = await Result.findOne({ studentId: session.studentId, examId: exam._id });
                        if (!existingResult) {
                            await Result.create({
                                studentId: session.studentId,
                                examId: exam._id,
                                score,
                                totalPoints: exam.questions.length,
                                answers: processedAnswers
                            });
                        }

                        // Close Session
                        session.status = 'completed';
                        await session.save();

                        console.log(`Auto-submitted session for student ${session.studentId}`);
                    } catch (err) {
                        console.error(`Error auto-submitting session ${session._id}:`, err);
                    }
                }

                // 3. Mark results as published
                exam.resultsPublished = true;
                await exam.save();

                // 4. Notify via Socket
                try {
                    const io = getIO();
                    io.to(exam._id.toString()).emit('exam-finalized', { examId: exam._id });
                } catch (e) {
                    console.error('Socket emission failed:', e);
                }
            }
        } catch (error) {
            console.error('Error in Exam Expiration Worker:', error);
        }
    }, 60000); // 1 minute
};
