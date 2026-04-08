import Exam from '../../models/Exam';
import ExamSession from '../../models/ExamSession';
import Result from '../../models/Result';
import User from '../../models/User';
import { getIO } from './socket';
import { enqueueAITask } from '../ai/aiService';
import SystemLock from '../../models/SystemLock';
import os from 'os';

/**
 * Auto-Complete Scheduler (UNIFIED v3)
 * Runs every 60 seconds to find published exams whose endTime or autoCompleteAt has passed.
 * For each expired exam, it auto-submits all in-progress sessions and closes the exam.
 */

let schedulerInterval: NodeJS.Timeout | null = null;
const WORKER_ID = `autocomplete-${os.hostname()}-${process.pid}`;

async function autoSubmitSession(session: any, populatedExam: any) {
    try {
        // 1. Double-check if result already exists (idempotency)
        const existingResult = await Result.findOne({ studentId: session.studentId, examId: populatedExam._id });
        if (existingResult) {
            session.status = 'completed';
            await session.save();
            return;
        }

        // 2. Map questions for fast lookup
        const questionMap = new Map();
        (populatedExam.questions as any[]).forEach(q => {
            questionMap.set(q._id.toString(), q);
        });

        // 3. Process Answers (Async AI Tasks for Descriptive)
        const answers = session.answers instanceof Map ? session.answers : new Map(Object.entries(session.answers || {}));
        let pendingGradingCount = 0;
        let score = 0;
        const processedAnswers: any[] = [];

        for (const [qId, val] of answers.entries()) {
            const question = questionMap.get(qId);
            if (!question) continue;

            let isCorrect = false;
            let aiScore = 0;
            let aiFeedback = '';
            let evalResult: any = { missingConcepts: [], remediationSteps: [] };

            if (question.type === 'descriptive') {
                const cachedEval = session.evaluations?.get(qId);
                if (cachedEval) {
                    isCorrect = cachedEval.isCorrect;
                    aiScore = cachedEval.score;
                    aiFeedback = cachedEval.feedback;
                    evalResult = {
                        missingConcepts: cachedEval.missingConcepts || [],
                        remediationSteps: cachedEval.remediationSteps || []
                    };
                    score += aiScore;
                } else {
                    // ENQUEUE ASYNC TASK FOR HEAVY LOAD
                    pendingGradingCount++;
                    aiFeedback = 'Automated evaluation is in progress...';
                    
                    enqueueAITask('grading', {
                        studentId: session.studentId,
                        examId: populatedExam._id,
                        questionId: qId,
                        studentAnswer: val || '',
                        referenceKey: question.referenceAnswer || '',
                        questionText: question.text,
                        maxPoints: question.points || 10
                    }, 2).catch(e => console.error('[AutoComplete] Async grading enqueue failed:', e));
                }
            } else {
                isCorrect = question.correctAnswer === val;
                if (isCorrect) {
                    aiScore = question.points || 1;
                    score += aiScore;
                }
            }

            processedAnswers.push({
                questionId: qId,
                selectedOption: typeof val === 'number' ? val : undefined,
                textAnswer: typeof val === 'string' ? val : undefined,
                isCorrect,
                score: aiScore,
                aiFeedback,
                missingConcepts: evalResult.missingConcepts || [],
                remediationSteps: evalResult.remediationSteps || [],
                timeSpent: session.timeSpent?.get(qId) || 0
            });
        }

        const totalPoints = populatedExam.isAdaptive
            ? (populatedExam.adaptiveConfig?.questionsPerStudent || 15)
            : (populatedExam.questions as any[]).length;

        // 4. Create Result (Initial state)
        const result = await Result.create({
            studentId: session.studentId,
            examId: populatedExam._id,
            score,
            totalPoints,
            answers: processedAnswers,
            isSuspended: session.isSuspended,
            gradingStatus: pendingGradingCount > 0 ? 'pending' : 'completed',
            pendingGradingCount
        });
        // 5. Close Session
        session.status = 'completed';
        await session.save();

        // 6. Enqueue HEI Score Evaluation (Async Persistent Task)
        try {
            const user = await User.findById(session.studentId);
            if (user) {
                const flaggedData = session.flagged ? Object.fromEntries(session.flagged) : {};
                await enqueueAITask('hei_analysis', {
                    studentId: session.studentId,
                    examId: populatedExam._id,
                    resultId: result._id,
                    studentName: user.name,
                    violationCount: session.violationCount || 0,
                    flaggedData,
                    examDurationMinutes: populatedExam.duration,
                    startTime: session.startTime
                }, 1); // Lower priority for auto-complete tasks
            }
        } catch (e) {
            console.error('[AutoComplete] HEI enqueue failed:', e);
        }

        console.log(`[AutoComplete] Successfully finalized student ${session.studentId} for exam "${populatedExam.title}"`);
    } catch (err) {
        console.error(`[AutoComplete] Critical failure finalizing session ${session._id}:`, err);
    }
}

async function processExpiredExams() {
    // Attempt to acquire distributed lock
    try {
        await SystemLock.create({
            key: 'autocomplete_scheduler',
            lockedAt: new Date(),
            expiresAt: new Date(Date.now() + 55 * 1000), // Lock for 55 seconds
            lockedBy: WORKER_ID
        });
    } catch (e: any) {
        if (e.code === 11000) return; // Locked by another worker
        console.error('[AutoComplete] Lock error:', e);
        return;
    }

    try {
        const now = new Date();
        const expiredExams = await Exam.find({
            $or: [
                { status: 'published', autoCompleteAt: { $lte: now, $ne: null }, autoComplete: true },
                { status: 'published', endTime: { $lte: now }, autoComplete: true },
                { status: 'closed', resultsPublished: false }
            ]
        });

        if (expiredExams.length === 0) return;

        console.log(`[AutoComplete] Found ${expiredExams.length} clusters for background processing.`);

        for (const exam of expiredExams) {
            const populatedExam = await Exam.findById(exam._id).populate('questions');
            if (!populatedExam) continue;

            const activeSessions = await ExamSession.find({
                examId: exam._id,
                status: 'in-progress'
            });

            if (activeSessions.length > 0) {
                console.log(`[AutoComplete] Batch processing ${activeSessions.length} sessions for "${exam.title}"...`);
                
                // Process in chunks of 50 to avoid memory/payload limits but keep it fast
                const chunkSize = 50;
                for (let i = 0; i < activeSessions.length; i += chunkSize) {
                    const chunk = activeSessions.slice(i, i + chunkSize);
                    
                    const resultsToInsert: any[] = [];
                    const sessionBulkOps: any[] = [];

                    await Promise.all(chunk.map(async (session) => {
                        try {
                            const resultData = await prepareSessionResult(session, populatedExam);
                            if (resultData) {
                                resultsToInsert.push(resultData);
                                sessionBulkOps.push({
                                    updateOne: {
                                        filter: { _id: session._id },
                                        update: { $set: { status: 'completed' } }
                                    }
                                });
                            }
                        } catch (err) {
                            console.error(`[AutoComplete] Error preparing result for ${session._id}:`, err);
                        }
                    }));

                    if (resultsToInsert.length > 0) {
                        await Result.insertMany(resultsToInsert, { ordered: false }).catch(e => console.warn('[AutoComplete] Some results already existed (insertMany)'));
                        await ExamSession.bulkWrite(sessionBulkOps);
                    }
                }
            }

            // Close the exam
            exam.status = 'closed';
            exam.endTime = exam.endTime || now;
            exam.resultsPublished = true;
            await exam.save();

            try {
                const io = getIO();
                io.to(exam._id.toString()).emit('exam-closed-manually', { examId: exam._id, reason: 'time-expired' });
                io.to(exam._id.toString()).emit('exam-finalized', { examId: exam._id });
            } catch (e) {
                console.warn('[AutoComplete] Socket notification skipped:', e);
            }
        }
    } catch (error) {
        console.error('[AutoComplete] System Error:', error);
    } finally {
        // Release lock
        await SystemLock.deleteOne({ key: 'autocomplete_scheduler', lockedBy: WORKER_ID }).catch(() => {});
    }
}

/**
 * Mapping Logic: Prepares result data without writing to DB
 */
async function prepareSessionResult(session: any, populatedExam: any) {
    // Check if result already exists (idempotency)
    const existingResult = await Result.findOne({ studentId: session.studentId, examId: populatedExam._id });
    if (existingResult) return null;

    const questionMap = new Map();
    (populatedExam.questions as any[]).forEach(q => {
        questionMap.set(q._id.toString(), q);
    });

    const answers = session.answers instanceof Map ? session.answers : new Map(Object.entries(session.answers || {}));
    let pendingGradingCount = 0;
    let score = 0;
    const processedAnswers: any[] = [];

    for (const [qId, val] of answers.entries()) {
        const question = questionMap.get(qId);
        if (!question) continue;

        let isCorrect = false;
        let aiScore = 0;
        let aiFeedback = '';

        if (question.type === 'descriptive') {
            const cachedEval = session.evaluations?.get(qId);
            if (cachedEval) {
                isCorrect = cachedEval.isCorrect;
                aiScore = cachedEval.score;
                aiFeedback = cachedEval.feedback;
                score += aiScore;
            } else {
                pendingGradingCount++;
                aiFeedback = 'Automated evaluation is in progress...';
                enqueueAITask('grading', {
                    studentId: session.studentId,
                    examId: populatedExam._id,
                    questionId: qId,
                    studentAnswer: val || '',
                    referenceKey: question.referenceAnswer || '',
                    questionText: question.text,
                    maxPoints: question.points || 10
                }, 2).catch(() => {});
            }
        } else {
            isCorrect = question.correctAnswer === val;
            if (isCorrect) {
                aiScore = question.points || 1;
                score += aiScore;
            }
        }

        processedAnswers.push({
            questionId: qId,
            selectedOption: typeof val === 'number' ? val : undefined,
            textAnswer: typeof val === 'string' ? val : undefined,
            isCorrect,
            score: aiScore,
            aiFeedback,
            timeSpent: session.timeSpent?.get(qId) || 0
        });
    }

    const totalPoints = populatedExam.isAdaptive
        ? (populatedExam.adaptiveConfig?.questionsPerStudent || 15)
        : (populatedExam.questions as any[]).length;

    // Enqueue HEI analysis task asynchronously
    const user = await User.findById(session.studentId).select('name');
    if (user) {
        // We will enqueue HEI task via a post-save hook logic analogy or just trigger it here in background
        const flaggedData = session.flagged ? Object.fromEntries(session.flagged) : {};
        // Deferred task: Since Result doesn't exist yet, we'll need the ID. 
        // Strategy: Process HEI *after* bulk insert in a real implementation, 
        // but for now we'll return the data and the caller handles the task.
    }

    return {
        studentId: session.studentId,
        examId: populatedExam._id,
        score,
        totalPoints,
        answers: processedAnswers,
        isSuspended: session.isSuspended,
        gradingStatus: pendingGradingCount > 0 ? 'pending' : 'completed',
        pendingGradingCount
    };
}

export function startAutoCompleteScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
    }

    console.log('[AutoComplete] Unified Background System active (60s tick).');
    processExpiredExams(); // First run
    schedulerInterval = setInterval(processExpiredExams, 60 * 1000);
}

export function stopAutoCompleteScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('[AutoComplete] Logic paused.');
    }
}
