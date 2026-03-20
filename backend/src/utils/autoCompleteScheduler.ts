import Exam from '../models/Exam';
import ExamSession from '../models/ExamSession';
import Result from '../models/Result';
import User from '../models/User';
import { getIO } from '../modules/communication/socket';
import { evaluateDescriptiveAnswer, enqueueAITask } from '../modules/ai/aiService';

/**
 * Auto-Complete Scheduler (UNIFIED v3)
 * Runs every 60 seconds to find published exams whose endTime or autoCompleteAt has passed.
 * For each expired exam, it auto-submits all in-progress sessions and closes the exam.
 */

let schedulerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

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
                    }, 2).catch((e: Error) => console.error('[AutoComplete] Async grading enqueue failed:', e));
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
        } catch (e: any) {
            console.error('[AutoComplete] HEI enqueue failed:', e);
        }

        console.log(`[AutoComplete] Successfully finalized student ${session.studentId} for exam "${populatedExam.title}"`);
    } catch (err) {
        console.error(`[AutoComplete] Critical failure finalizing session ${session._id}:`, err);
    }
}

async function processExpiredExams() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const now = new Date();
        // UNIFIED QUERY: Handle multiple expiry triggers from both legacy worker and new scheduler
        const expiredExams = await Exam.find({
            $or: [
                { status: 'published', autoCompleteAt: { $lte: now, $ne: null }, autoComplete: true },
                { status: 'published', endTime: { $lte: now }, autoComplete: true },
                { status: 'closed', resultsPublished: false } // Catch-up for any missed closures or manual closures
            ]
        });

        if (expiredExams.length === 0) return;

        console.log(`[AutoComplete] Found ${expiredExams.length} clusters for background processing.`);

        for (const exam of expiredExams) {
            // POPULATE ONCE PER EXAM CLUSTER (Optimization)
            const populatedExam = await Exam.findById(exam._id).populate('questions');
            if (!populatedExam) continue;

            const activeSessions = await ExamSession.find({
                examId: exam._id,
                status: 'in-progress'
            });

            if (activeSessions.length > 0) {
                console.log(`[AutoComplete] Processing ${activeSessions.length} in-flight sessions for "${exam.title}"...`);
                // Use sequential processing to respect AI rate limits for descriptive evaluations
                for (const session of activeSessions) {
                    await autoSubmitSession(session, populatedExam);
                }
            }

            // Close the exam and finalize status
            exam.status = 'closed';
            exam.endTime = exam.endTime || now;
            exam.resultsPublished = true;
            await exam.save();

            // Broad-stroke socket notification for all students in the room
            try {
                const io = getIO();
                io.to(exam._id.toString()).emit('exam-closed-manually', { examId: exam._id, reason: 'time-expired' });
                io.to(exam._id.toString()).emit('exam-finalized', { examId: exam._id });
            } catch (e) {
                console.warn('[AutoComplete] Socket notification skipped:', e);
            }

            console.log(`[AutoComplete] Exam "${exam.title}" is now archived.`);
        }
    } catch (error) {
        console.error('[AutoComplete] System Error:', error);
    } finally {
        isProcessing = false;
    }
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
