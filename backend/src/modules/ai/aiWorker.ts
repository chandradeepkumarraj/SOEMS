import AITask from '../../models/AITask';
import Result from '../../models/Result';
import { evaluateDescriptiveAnswer, generateHEIReport, generateQuestions } from './aiService';
import { getIO } from '../communication/communicationModule';

let workerInterval: NodeJS.Timeout | null = null;
let isBusy = false;

const processTask = async (task: any) => {
    try {
        task.status = 'processing';
        task.attempts += 1;
        await task.save();

        let result: any;

        switch (task.type) {
            case 'grading': {
                const { studentAnswer, referenceKey, questionText, maxPoints, studentId, examId, questionId } = task.payload;
                result = await evaluateDescriptiveAnswer(studentAnswer, referenceKey, questionText, maxPoints);
                
                const examResult = await Result.findOne({ studentId, examId });
                if (examResult) {
                    const answerIndex = examResult.answers.findIndex(a => a.questionId.toString() === questionId.toString());
                    if (answerIndex !== -1) {
                        const ans = examResult.answers[answerIndex];
                        ans.score = result.score;
                        ans.aiFeedback = result.feedback;
                        ans.isCorrect = result.score >= (maxPoints * 0.7);
                        ans.missingConcepts = result.missingConcepts;
                        ans.remediationSteps = result.remediationSteps;
                        
                        examResult.pendingGradingCount = Math.max(0, examResult.pendingGradingCount - 1);
                        if (examResult.pendingGradingCount === 0) {
                            examResult.gradingStatus = 'completed';
                        }
                        
                        examResult.score = examResult.answers.reduce((acc, curr) => acc + (curr.score || 0), 0);
                        await examResult.save();

                        try {
                            const io = getIO();
                            io.to(examId.toString()).emit('grading-update', { 
                                studentId, 
                                examId, 
                                questionId, 
                                score: result.score,
                                status: examResult.gradingStatus 
                            });
                        } catch (e) {}
                    }
                }
                break;
            }
            case 'hei_analysis': {
                const { studentName, violationCount, flaggedData, examDurationMinutes, studentId, examId, resultId, startTime } = task.payload;
                result = await generateHEIReport(studentName, violationCount, flaggedData, examDurationMinutes);
                
                const examResult = await Result.findById(resultId);
                if (examResult) {
                    examResult.heiScore = result.heiScore;
                    examResult.heiSummary = result.heiSummary;

                    const badges: any[] = [];
                    if (result.heiScore >= 95) {
                        badges.push({
                            type: 'integrity',
                            label: 'Integrity Shield',
                            icon: 'integrity_shield',
                            description: 'Awarded for exceptional academic integrity.'
                        });
                    }

                    const submittedAt = examResult.submittedAt || new Date();
                    const startAt = new Date(startTime);
                    const timeTakenMs = submittedAt.getTime() - startAt.getTime();
                    const durationMs = examDurationMinutes * 60 * 1000;
                    
                    const totalPointsForPercent = examResult.totalPoints || 100;
                    if (timeTakenMs < (durationMs * 0.35) && (examResult.score / totalPointsForPercent) >= 0.8) {
                        badges.push({
                            type: 'speed',
                            label: 'Speedster',
                            icon: 'speed_bolt',
                            description: 'Awarded for completing the exam with remarkable speed and accuracy.'
                        });
                    }

                    const higherScoreCount = await Result.countDocuments({ examId, score: { $gt: examResult.score } });
                    const sameScoreEarlierCount = await Result.countDocuments({ examId, score: examResult.score, submittedAt: { $lt: examResult.submittedAt } });
                    const myRank = higherScoreCount + sameScoreEarlierCount + 1;

                    if (myRank <= 3 && examResult.score > 0) {
                        const rankLabels = ['Academic Titan (1st)', 'Scholar Gold (2nd)', 'Expert Bronze (3rd)'];
                        const rankIcons = ['gold_medal', 'silver_medal', 'bronze_medal'];
                        badges.push({ 
                            type: 'rank', 
                            label: rankLabels[myRank - 1], 
                            icon: rankIcons[myRank - 1], 
                            description: `Awarded for achieving Rank ${myRank} amongst all participants.` 
                        });
                    }

                    examResult.badges = badges;
                    await examResult.save();

                    try {
                        const io = getIO();
                        io.to(examId.toString()).emit('result-finalized', { studentId, examId, resultId });
                    } catch (e) {}
                }
                break;
            }
            case 'question_gen': {
                const { subject, topic, count, difficulty, type } = task.payload;
                result = await generateQuestions(subject, topic, count, difficulty, type);
                break;
            }
        }

        task.result = result;
        task.status = 'completed';
        task.completedAt = new Date();
        await task.save();

    } catch (error: any) {
        console.error(`[AI Worker] Task ${task._id} critical failure:`, error.message, error.stack);
        task.lastError = error.message;
        task.status = task.attempts >= 3 ? 'failed' : 'pending';
        await task.save();
    }
};

export const runAIWorker = async () => {
    if (isBusy) return;
    isBusy = true;
    try {
        const tasks = await AITask.find({ status: 'pending' }).sort({ priority: -1, createdAt: 1 }).limit(5);
        if (tasks.length > 0) await Promise.all(tasks.map(t => processTask(t)));
    } catch (e) {
        console.error('[AI Worker] Loop Error:', e);
    } finally {
        isBusy = false;
    }
};

export const startAIWorker = () => {
    if (workerInterval) return;
    console.log('[AI Worker] Started.');
    workerInterval = setInterval(runAIWorker, 10000);
};

export const stopAIWorker = () => {
    if (workerInterval) { clearInterval(workerInterval); workerInterval = null; }
};
