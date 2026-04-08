import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import Exam from '../../models/Exam';
import Result from '../../models/Result';
import Question from '../../models/Question';
import ExamSession from '../../models/ExamSession';
import User, { Student } from '../../models/User';
import Violation from '../../models/Violation';
import { getIO } from '../communication/communicationModule';
import Notification from '../../models/Notification';
import Group from '../../models/Group';
import { AuthRequest } from '../auth/authModule';
import { evaluateDescriptiveAnswer, generateHEIReport, generateQuestions, enqueueAITask } from '../ai/aiModule';

// @route   POST /api/exams/:id/submit
// @access  Private (Student)
export const submitExam = async (req: AuthRequest, res: Response) => {
    try {
        const { answers } = req.body; // Array of { questionId, selectedOption }
        const examId = req.params.id;
        const studentId = req.user._id;

        // 1. Check if already submitted (Idempotency fix)
        const existingResult = await Result.findOne({ studentId, examId });
        if (existingResult) {
            console.log(`[Submit] Student ${studentId} already submitted exam ${examId}. Returning existing result.`);
            return res.status(200).json(existingResult);
        }

        // 2. Fetch Exam, Questions and Session
        const [exam, session] = await Promise.all([
            Exam.findById(examId).populate('questions'),
            ExamSession.findOne({ studentId, examId, status: 'in-progress' })
        ]);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        if (!session) {
            return res.status(404).json({ message: 'Active exam session not found.' });
        }

        // 2b. Secondary Authorization Check (Defense in Depth)
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student record not found.' });

        if (exam.allowedGroups?.length || exam.allowedSubgroups?.length) {
            const isGroupAuth = exam.allowedGroups?.some(id => id.toString() === student.groupId?.toString());
            const isSubgroupAuth = exam.allowedSubgroups?.some(id => id.toString() === student.subgroupId?.toString());

            if (!isGroupAuth && !isSubgroupAuth) {
                return res.status(403).json({ message: 'You are no longer authorized to submit this exam (Group Membership Invalid).' });
            }
        }

        const questionMap = new Map();
        (exam.questions as any[]).forEach(q => {
            questionMap.set(q._id.toString(), q);
        });

        // 3. Calculate Score
        let score = 0;
        let totalPoints = 0;

        // For Adaptive Exams: answers array in body might be empty because progress is saved as-you-go.
        // We merge/fallback to session.answers.
        let finalAnswersToProcess = answers || [];
        if (exam.isAdaptive && finalAnswersToProcess.length === 0 && session.answers) {
            finalAnswersToProcess = Array.from(session.answers.entries()).map(([qId, val]) => {
                const q = questionMap.get(qId);
                return {
                    questionId: qId,
                    selectedOption: typeof val === 'number' ? val : null,
                    textAnswer: typeof val === 'string' ? val : undefined,
                    timeSpent: session.timeSpent?.get(qId) || 0
                };
            });
        }

        // 3. Process Answers (Async AI Tasks for Descriptive)
        let pendingGradingCount = 0;
        const processedAnswers: any[] = [];

        for (const ans of finalAnswersToProcess) {
            const question = questionMap.get(ans.questionId);
            if (!question) continue;

            let isCorrect = false;
            let aiScore = 0;
            let aiFeedback = '';
            let evalResult: any = { missingConcepts: [], remediationSteps: [] };

            if (question.type === 'descriptive') {
                const cachedEval = session.evaluations?.get(ans.questionId);
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
                    
                    // We don't await this, just push to worker queue
                    enqueueAITask('grading', {
                        studentId,
                        examId,
                        questionId: ans.questionId,
                        studentAnswer: ans.textAnswer || '',
                        referenceKey: question.referenceAnswer || '',
                        questionText: question.text,
                        maxPoints: question.points || 10
                    }, 5).catch(e => console.error('[Submit] Async grading enqueue failed:', e));
                }
            } else {
                isCorrect = question.correctAnswer === ans.selectedOption;
                if (isCorrect) {
                    aiScore = question.points || 1;
                    score += aiScore;
                }
            }

            processedAnswers.push({
                questionId: ans.questionId,
                selectedOption: ans.selectedOption,
                textAnswer: ans.textAnswer,
                isCorrect,
                score: aiScore,
                aiFeedback,
                missingConcepts: evalResult.missingConcepts || [],
                remediationSteps: evalResult.remediationSteps || [],
                timeSpent: ans.timeSpent || 0
            });
        }

        // Adaptive exams are scored out of questionsPerStudent, not the whole pool.
        totalPoints = exam.isAdaptive ? (exam.adaptiveConfig?.questionsPerStudent || 15) : exam.questions.length;

        // 4. Create Result (Initial state)
        const result = await Result.create({
            studentId,
            examId,
            score,
            totalPoints,
            answers: processedAnswers,
            isSuspended: session.isSuspended,
            gradingStatus: pendingGradingCount > 0 ? 'pending' : 'completed',
            pendingGradingCount
        });

        // 5. Update and Close Session
        session.status = 'completed';
        await session.save();

        // 6. Enqueue HEI Score Evaluation (Async Persistent Task)
        // Note: Badge calculation is now offloaded to the AI Worker to ensure all scores are ready.
        try {
            const user = await User.findById(studentId);
            if (user) {
                const durationMins = exam.duration;
                const flaggedData = session.flagged ? Object.fromEntries(session.flagged) : {};

                await enqueueAITask('hei_analysis', {
                    studentId,
                    examId,
                    resultId: result._id,
                    studentName: user.name,
                    violationCount: session.violationCount || 0,
                    flaggedData,
                    examDurationMinutes: durationMins,
                    startTime: session.startTime
                }, 3);
                console.log(`[AI Queue] Enqueued HEI & Badge Analysis for ${user.name}`);
            }
        } catch (e) {
            console.error('[Submit] Failed to enqueue HEI analysis:', e);
        }

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
export const startExam = async (req: AuthRequest, res: Response) => {
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

        // 2. Authorization check: Is student allowed to take this exam?
        if (req.user.role === 'student') {
            const isGroupAllowed = !exam.allowedGroups || exam.allowedGroups.length === 0 ||
                exam.allowedGroups.some(gId => gId.toString() === req.user.groupId?.toString());

            const isSubgroupAllowed = !exam.allowedSubgroups || exam.allowedSubgroups.length === 0 ||
                exam.allowedSubgroups.some(sId => sId.toString() === req.user.subgroupId?.toString());

            if (!isGroupAllowed || !isSubgroupAllowed) {
                return res.status(403).json({ message: 'You are not authorized to take this examination.' });
            }

            if (exam.status !== 'published') {
                return res.status(400).json({ message: 'This exam is not available for students yet.' });
            }
        }

        // 3. Check if started or expired — with 15-min early entry window for Virtual Exam Hall
        const now = new Date();
        const earlyEntryWindowMs = 15 * 60 * 1000; // 15 minutes before start
        const earlyEntryThreshold = new Date(exam.startTime.getTime() - earlyEntryWindowMs);

        if (now < earlyEntryThreshold) {
            // Too early even for the hall — hard block
            return res.status(400).json({
                message: `This exam opens for early entry at ${earlyEntryThreshold.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Come back later.`
            });
        }

        const isEarlyEntry = now < exam.startTime;
        if (now > exam.endTime) {
            return res.status(400).json({ message: 'This exam has expired.' });
        }

        // 3. Check for existing session
        let session = await ExamSession.findOne({ studentId, examId });

        if (session) {
            if (session.status === 'completed') {
                return res.status(400).json({ message: 'You have already completed this exam.' });
            }
            if (session.isSuspended) {
                return res.status(403).json({
                    message: 'Your exam session has been suspended due to multiple proctoring violations.',
                    isSuspended: true
                });
            }
            const obj = session.toObject();
            return res.json({
                ...obj,
                answers: session.answers ? Object.fromEntries(session.answers) : {},
                timeSpent: session.timeSpent ? Object.fromEntries(session.timeSpent) : {},
                flagged: session.flagged ? Object.fromEntries(session.flagged) : {},
                serverTime: new Date(),
                isEarlyEntry,
                examStartTime: exam.startTime
            });
        }

        // 4. Create new session with race-condition handling
        try {
            session = await ExamSession.create({
                studentId,
                examId,
                startTime: now,
                lastSyncTime: now,
                answers: {},
                timeSpent: {},
                flagged: {},
                status: 'in-progress',
                ...(exam.isAdaptive ? {
                    adaptiveState: {
                        currentDifficulty: 'medium',
                        questionsServed: [],
                        trailingCorrect: 0,
                        trailingTotal: 0
                    }
                } : {})
            });
        } catch (err: any) {
            // If another request created the session in the last few ms, return that one
            if (err.code === 11000) {
                session = await ExamSession.findOne({ studentId, examId });
                if (!session) throw new Error('Race condition failed to retrieve session.');
            } else {
                throw err;
            }
        }

        res.status(201).json({
            ...session.toObject(),
            serverTime: new Date(),
            isEarlyEntry,
            examStartTime: exam.startTime
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update exam session progress
// @route   POST /api/exams/progress/:id
// @access  Private
export const updateSessionProgress = async (req: AuthRequest, res: Response) => {
    try {
        const { id: examId } = req.params;
        const studentId = req.user._id;
        const { answers, timeSpent, flagged, idCardFront, idCardBack } = req.body;

        const [session, exam] = await Promise.all([
            ExamSession.findOne({ studentId, examId, status: 'in-progress' }),
            Exam.findById(examId).select('isAdaptive')
        ]);

        if (!session) {
            return res.status(404).json({ message: 'Active session not found.' });
        }

        if (session.isSuspended) {
            return res.status(403).json({ message: 'Session suspended.' });
        }

        if (answers && !exam?.isAdaptive) session.answers = answers;
        if (timeSpent) session.timeSpent = timeSpent;
        if (flagged) session.flagged = flagged;
        if (idCardFront) session.idCardFront = idCardFront;
        if (idCardBack) session.idCardBack = idCardBack;

        session.markModified('answers');
        session.markModified('timeSpent');
        session.markModified('flagged');
        if (idCardFront) session.markModified('idCardFront');
        if (idCardBack) session.markModified('idCardBack');

        session.lastSyncTime = new Date();

        await session.save();

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


// Helper for C.A.T. pool generation
const triggerAdaptiveGeneration = (exam: any, adaptiveConfig: any, user: any) => {
    (async () => {
        try {
            // Concurrency Lock: Check fresh state to prevent race conditions during rapid triggers
            const freshExam = await Exam.findById(exam._id);
            if (!freshExam || freshExam.generationStatus === 'generating') {
                console.log(`[C.A.T.] Generation already in progress or completed for \"${exam.title}\". Skipping redundant trigger.`);
                return;
            }

            // Mark generation as in-progress (Atomic release lock if we were using a more complex system, but this is sufficient for MVP)
            await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'generating' });

            const poolSize = adaptiveConfig.questionPoolSize || 10;
            const subject = adaptiveConfig.subject || exam.title;
            const topic = adaptiveConfig.topic || 'General';

            console.log(`[C.A.T.] Starting pre-generation pipeline for exam: ${exam.title} (Pool: ${poolSize} per tier)`);

            // Helper for individual tier generation with logging
            const getTier = async (difficulty: 'easy' | 'medium' | 'hard') => {
                try {
                    console.log(`[C.A.T.] Generating ${difficulty} questions...`);
                    const qs = await generateQuestions(subject, topic, poolSize, difficulty, 'mcq');
                    console.log(`[C.A.T.] Successfully generated ${qs.length} ${difficulty} questions.`);
                    return qs.map((q: any) => ({ ...q, difficulty, subject, type: 'mcq', creatorId: user._id }));
                } catch (err: any) {
                    console.error(`[C.A.T.] Critical failure generating ${difficulty} tier:`, err.message);
                    throw err; // Stop the pipe if even the internal retry fails
                }
            };

            // Process tiers sequentially for better resource handling and logging clarity
            const easyQs = await getTier('easy');
            const mediumQs = await getTier('medium');
            const hardQs = await getTier('hard');

            const allGeneratedQuestions = [...easyQs, ...mediumQs, ...hardQs];

            console.log(`[C.A.T.] Pipeline successful. Saving ${allGeneratedQuestions.length} questions to database...`);
            const savedQuestions = await Question.insertMany(allGeneratedQuestions);
            const questionIds = savedQuestions.map(q => q._id);

            if (questionIds.length > 0) {
                await Exam.findByIdAndUpdate(exam._id, { questions: questionIds, generationStatus: 'completed' });
                console.log(`[C.A.T.] Pre-generation complete for \"${exam.title}\". Final Pool: ${questionIds.length} questions.`);
            } else {
                await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'failed' });
                console.error(`[C.A.T.] Final pool check yielded 0 questions for exam: ${exam.title}`);
            }
        } catch (err: any) {
            console.error('[C.A.T.] Pipeline crashed:', err.message);
            try {
                await Exam.findByIdAndUpdate(exam._id, { generationStatus: 'failed' });
            } catch (updateErr) {
                console.error('[C.A.T.] Failed to update generation status:', updateErr);
            }
        }
    })();
};

// @route   POST /api/exams
// @access  Private (Teacher/Admin)
export const createExam = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, questions, duration, startTime, endTime, status, allowedGroups, allowedSubgroups, proctors: manualProctors, proctoringConfig, isAdaptive, adaptiveConfig, autoComplete, gracePeriod } = req.body;

        // --- Persistent Proctor Auto-Assignment ---
        let finalProctors = manualProctors || [];
        if (finalProctors.length > 0) {
            // Audit & Integrity: Verify each manual proctor actually has the 'proctor' role
            const validProctors = await User.find({
                _id: { $in: finalProctors },
                role: 'proctor'
            }).select('_id');
            finalProctors = validProctors.map(p => p._id.toString());
        }

        if (finalProctors.length === 0) {
            const teacherValue = req.user;
            const proctorSet = new Set<string>();

            // 1. Check Teacher's Preferred Proctor
            if (teacherValue.defaultProctorId && mongoose.Types.ObjectId.isValid(teacherValue.defaultProctorId)) {
                const proctorExists = await User.exists({ _id: teacherValue.defaultProctorId, role: 'proctor' });
                if (proctorExists) proctorSet.add(teacherValue.defaultProctorId.toString());
            }

            // 2. Check Department (Group) association
            if (teacherValue.groupId && mongoose.Types.ObjectId.isValid(teacherValue.groupId)) {
                const group = await Group.findById(teacherValue.groupId);
                if (group && (group as any).departmentProctorId) {
                    const deptProctorExists = await User.exists({ _id: (group as any).departmentProctorId, role: 'proctor' });
                    if (deptProctorExists) proctorSet.add((group as any).departmentProctorId.toString());
                }

                // 3. Find all proctors in the same department
                const sameDeptProctors = await User.find({
                    role: 'proctor',
                    groupId: teacherValue.groupId
                }).select('_id');

                sameDeptProctors.forEach(p => proctorSet.add(p._id.toString()));
            }

            finalProctors = Array.from(proctorSet);
        }

        const grace = gracePeriod ? parseInt(gracePeriod) : 0;
        const autoCompleteTime = endTime ? new Date(new Date(endTime).getTime() + (grace * 60000)) : undefined;

        const exam = await Exam.create({
            title,
            description,
            questions: questions || [],
            duration,
            startTime,
            endTime,
            status: status || 'draft',
            allowedGroups: allowedGroups || [],
            allowedSubgroups: allowedSubgroups || [],
            proctors: finalProctors,
            proctoringConfig,
            isAdaptive: isAdaptive || false,
            adaptiveConfig: isAdaptive ? adaptiveConfig : undefined,
            creatorId: req.user._id,
            autoCompleteAt: autoCompleteTime,
            autoComplete: autoComplete !== undefined ? autoComplete : true,
            gracePeriod: grace
        });

        // If adaptive, fire async pre-generation pipeline
        if (isAdaptive && adaptiveConfig) {
            triggerAdaptiveGeneration(exam, adaptiveConfig, req.user);
        }

        res.status(201).json(exam);

        // Notify students if published immediately
        if (exam.status === 'published') {
            try {
                const io = getIO();
                io.emit('new-notification', {
                    type: 'exam',
                    title: 'New Exam Published',
                    message: exam.title,
                    timestamp: new Date()
                });
            } catch (e) {
                console.error('Socket notification failed:', e);
            }
        }
    } catch (error: any) {
        console.error('Error creating exam:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req: AuthRequest, res: Response) => {
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
        } else if (req.user && (req.user.role === 'proctor' || req.user.role === 'teacher')) {
            // Enhanced Visibility: Teachers/Proctors see:
            // 1. Exams they created
            // 2. Exams where they are manually assigned as proctors
            // 3. Exams belonging to their managed departments (Groups)
            const managedGroups = req.user.managedGroups || [];
            query.$or = [
                { creatorId: req.user._id },
                { proctors: req.user._id },
                { allowedGroups: { $in: managedGroups } }
            ];
        }

        const exams = await Exam.find(query).populate('creatorId', 'name email').lean();

        // Efficiently fetch counts and statuses (Optimized to reduce N+1 queries)
        const examIds = exams.map(e => e._id);

        // Fetch all candidates counts in one go
        const candidateCounts = await Result.aggregate([
            { $match: { examId: { $in: examIds } } },
            { $group: { _id: '$examId', count: { $sum: 1 } } }
        ]);
        const countsMap = new Map(candidateCounts.map(c => [c._id.toString(), c.count]));

        let resultsMap = new Map();
        let sessionsMap = new Map();

        if (req.user && req.user.role === 'student') {
            const [studentResults, studentSessions] = await Promise.all([
                Result.find({ studentId: req.user._id, examId: { $in: examIds } }).select('examId').lean(),
                ExamSession.find({ studentId: req.user._id, examId: { $in: examIds }, status: 'in-progress' }).select('examId').lean()
            ]);
            resultsMap = new Map(studentResults.map(r => [r.examId.toString(), true]));
            sessionsMap = new Map(studentSessions.map(s => [s.examId.toString(), true]));
        }

        const examsWithStatus = exams.map((exam: any) => {
            const idStr = exam._id.toString();
            let studentStatusValue = 'not-started';
            if (resultsMap.get(idStr)) studentStatusValue = 'completed';
            else if (sessionsMap.get(idStr)) studentStatusValue = 'in-progress';

            return {
                ...exam,
                candidatesCount: countsMap.get(idStr) || 0,
                studentStatus: studentStatusValue
            };
        });

        res.json(examsWithStatus);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = async (req: AuthRequest, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('questions')
            .populate('creatorId', 'name email');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Deep clone exam to modify it without affecting DB or other references
        const examObj = exam.toObject();

        if (req.user.role === 'student') {
            // Check if student has already submitted
            const existingResult = await Result.findOne({ studentId: req.user._id, examId: exam._id });
            const canViewAnswers = existingResult && exam.resultsPublished;

            if (!canViewAnswers) {
                // Strip answers from questions
                examObj.questions = examObj.questions.map((q: any) => {
                    const sanitized = { ...q };
                    delete sanitized.correctAnswer;
                    delete sanitized.referenceAnswer;
                    return sanitized;
                });
            }
        }

        res.json(examObj);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Teacher/Admin)
export const updateExam = async (req: AuthRequest, res: Response) => {
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
            proctoringConfig,
            isAdaptive,
            adaptiveConfig,
            autoComplete,
            gracePeriod,
            proctors: manualProctors
        } = req.body;

        // --- Persistent Proctor Auto-Assignment ---
        let finalProctors = manualProctors || [];
        if (finalProctors.length > 0) {
            // Audit & Integrity: Verify each manual proctor actually has the 'proctor' role
            const validProctors = await User.find({
                _id: { $in: finalProctors },
                role: 'proctor'
            }).select('_id');
            finalProctors = validProctors.map(p => p._id.toString());
        }

        if (finalProctors.length === 0) {
            const teacherValue = req.user;
            const proctorSet = new Set<string>();

            // 1. Check Teacher's Preferred Proctor
            if (teacherValue.defaultProctorId && mongoose.Types.ObjectId.isValid(teacherValue.defaultProctorId)) {
                const proctorExists = await User.exists({ _id: teacherValue.defaultProctorId, role: 'proctor' });
                if (proctorExists) proctorSet.add(teacherValue.defaultProctorId.toString());
            }

            // 2. Check Department (Group) association
            if (teacherValue.groupId && mongoose.Types.ObjectId.isValid(teacherValue.groupId)) {
                const group = await Group.findById(teacherValue.groupId);
                if (group && (group as any).departmentProctorId) {
                    const deptProctorExists = await User.exists({ _id: (group as any).departmentProctorId, role: 'proctor' });
                    if (deptProctorExists) proctorSet.add((group as any).departmentProctorId.toString());
                }

                // 3. Find all proctors in the same department
                const sameDeptProctors = await User.find({
                    role: 'proctor',
                    groupId: teacherValue.groupId
                }).select('_id');

                sameDeptProctors.forEach(p => proctorSet.add(p._id.toString()));
            }

            finalProctors = Array.from(proctorSet);
        }

        // Check if adaptive config changed to trigger re-generation
        const adaptiveChanged = isAdaptive && (
            !exam.isAdaptive ||
            JSON.stringify(adaptiveConfig) !== JSON.stringify(exam.adaptiveConfig)
        );

        // Prevent structural changes if there are active or past sessions
        if (questions || duration) {
            const hasSessions = await ExamSession.exists({ examId: exam._id });
            if (hasSessions) {
                // If attempting to modify locked fields, return error
                if ((questions && JSON.stringify(questions) !== JSON.stringify(exam.questions)) ||
                    (duration && duration !== exam.duration)) {
                    return res.status(400).json({
                        message: 'Cannot modify questions or duration because students have already started or completed this exam.'
                    });
                }
            }
        }

        exam.title = title || exam.title;
        exam.description = description !== undefined ? description : exam.description;
        exam.questions = questions || exam.questions;
        exam.duration = duration || exam.duration;
        exam.startTime = startTime || exam.startTime;
        exam.endTime = endTime || exam.endTime;

        const grace = gracePeriod !== undefined ? parseInt(gracePeriod) : exam.gracePeriod;
        exam.gracePeriod = grace;
        exam.autoCompleteAt = exam.endTime ? new Date(new Date(exam.endTime).getTime() + (grace * 60000)) : undefined; // Sync auto-complete with endTime & grace Period

        exam.autoComplete = autoComplete !== undefined ? autoComplete : exam.autoComplete;
        exam.status = status || exam.status;
        exam.resultsPublished = resultsPublished !== undefined ? resultsPublished : exam.resultsPublished;
        exam.allowedGroups = allowedGroups || exam.allowedGroups;
        exam.allowedSubgroups = allowedSubgroups || exam.allowedSubgroups;
        exam.proctors = finalProctors;
        exam.proctoringConfig = proctoringConfig || exam.proctoringConfig;

        // Adaptive fields
        exam.isAdaptive = isAdaptive !== undefined ? isAdaptive : exam.isAdaptive;
        if (adaptiveConfig) exam.adaptiveConfig = adaptiveConfig;

        const updatedExam = await exam.save();
        res.json(updatedExam);

        // Trigger re-generation if changed
        if (adaptiveChanged) {
            // Reset status before re-triggering so students see 'generating' instead of stale 'completed'
            await Exam.findByIdAndUpdate(updatedExam._id, { generationStatus: 'pending' });
            triggerAdaptiveGeneration(updatedExam, adaptiveConfig, req.user);
        }

        // Notify students if exam is newly published or updated while published
        if (updatedExam.status === 'published') {
            try {
                // Find users in allowed groups
                const targetUsers = await User.find({
                    $or: [
                        { group: { $in: updatedExam.allowedGroups } },
                        { subgroup: { $in: updatedExam.allowedSubgroups } }
                    ],
                    role: 'student'
                }).select('_id');

                const notificationsToInsert = targetUsers.map(user => ({
                    recipient: user._id,
                    type: 'exam',
                    title: 'New Exam Available',
                    message: `${updatedExam.title} has been scheduled.`,
                    relatedId: updatedExam._id
                }));

                if (notificationsToInsert.length > 0) {
                    const inserted = await Notification.insertMany(notificationsToInsert);
                    const io = getIO();
                    inserted.forEach(noti => {
                        io.emit(`notification-${noti.recipient.toString()}`, noti);
                    });
                    // Fallback multi-cast for connected active sessions
                    io.emit('new-notification', {
                        type: 'exam',
                        title: 'New Exam Available',
                        message: `${updatedExam.title} has been scheduled.`,
                    });
                }
            } catch (e) {
                console.error('Persistent Notification insertion failed:', e);
            }
        }

        // Notify students if results are published
        if (updatedExam.resultsPublished) {
            try {
                const results = await Result.find({ examId: updatedExam._id }).select('studentId');
                const targetWaiters = results.map(r => r.studentId);

                const notificationsToInsert = targetWaiters.map(userId => ({
                    recipient: userId,
                    type: 'result',
                    title: 'Results Published',
                    message: `Results for ${updatedExam.title} are now available!`,
                    relatedId: updatedExam._id
                }));

                if (notificationsToInsert.length > 0) {
                    const inserted = await Notification.insertMany(notificationsToInsert);
                    const io = getIO();
                    inserted.forEach(noti => {
                        io.emit(`notification-${noti.recipient.toString()}`, noti);
                    });
                    io.emit('new-notification', {
                        type: 'result',
                        title: 'Results Published',
                        message: `Results for ${updatedExam.title} are now available!`,
                    });
                }
            } catch (e) {
                console.error('Persistent Result Notification insertion failed:', e);
            }
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
            // Cascade: Delete Sessions, Results, and Violations associated with this exam
            await ExamSession.deleteMany({ examId: exam._id });
            await Result.deleteMany({ examId: exam._id });
            await Violation.deleteMany({ examId: exam._id });

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

// @desc    Reset an exam for re-take (wipe all student data)
// @route   POST /api/exams/:id/reset
// @access  Private (Teacher/Admin)
export const resetExam = async (req: AuthRequest, res: Response) => {
    try {
        const { regenerateQuestions } = req.body;
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check ownership
        if (req.user.role !== 'admin' && exam.creatorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reset this exam' });
        }

        // Only allow reset on closed or archived exams (not active ones)
        if (exam.status === 'published') {
            const now = new Date();
            // Allow if it's already ended by time, otherwise stop it
            if (now < exam.endTime) {
                return res.status(400).json({ message: 'Cannot reset an active exam. Stop it first.' });
            }
        }

        // 1. Data Cleanup: Delete all associated student data in parallel
        const [deletedResults, deletedSessions, deletedViolations] = await Promise.all([
            Result.deleteMany({ examId: exam._id }),
            ExamSession.deleteMany({ examId: exam._id }),
            Violation.deleteMany({ examId: exam._id })
        ]);

        // 2. Question Cleanup logic for Adaptive (CAT) Exams
        let poolRegenerated = false;
        if (exam.isAdaptive) {
            // Delete existing AI generated questions if requested OR if pool is empty/failed
            if (regenerateQuestions || exam.questions.length === 0 || exam.generationStatus === 'failed') {
                if (exam.questions && exam.questions.length > 0) {
                    await Question.deleteMany({ _id: { $in: exam.questions } });
                    exam.questions = [];
                }
                exam.generationStatus = 'pending';
                poolRegenerated = true;
            }
        }

        // Reset exam status to published for re-take
        exam.status = 'published';

        // Set a new startTime 2 minutes in the future for system readiness
        const newStartTime = new Date(Date.now() + 2 * 60 * 1000);
        exam.startTime = newStartTime;

        // Recalculate autoCompleteAt/endTime relative to the new delayed startTime
        // Add a 15-minute grace period to the end time so students don't lose time in the waiting hall
        const gracePeriodMs = 15 * 60 * 1000;
        const newEndTime = new Date(newStartTime.getTime() + (exam.duration * 60 * 1000) + gracePeriodMs);
        exam.endTime = newEndTime;
        exam.autoCompleteAt = newEndTime;

        await exam.save();

        // 3. Re-trigger generation if needed
        if (poolRegenerated) {
            console.log(`[C.A.T. Deep Reset] Triggering fresh pool generation for: ${exam.title}`);
            triggerAdaptiveGeneration(exam, exam.adaptiveConfig, req.user);
        }

        // Notify students via Socket that the exam is republished/reset
        try {
            const io = getIO();
            io.emit('new-notification', {
                type: 'exam',
                title: 'Exam Republished',
                message: `The exam "${exam.title}" has been reset and is now scheduled for retake.`,
                timestamp: new Date()
            });
        } catch (e) {
            console.error('Socket notification failed for reset:', e);
        }

        console.log(`[Exam Reset] Exam \"${exam.title}\" reset. Deleted: ${deletedResults.deletedCount} results, ${deletedSessions.deletedCount} sessions, ${deletedViolations.deletedCount} violations.`);

        res.json({
            message: 'Exam reset successfully. All student data has been cleared.',
            deletedResults: deletedResults.deletedCount,
            deletedSessions: deletedSessions.deletedCount,
            deletedViolations: deletedViolations.deletedCount
        });
    } catch (error: any) {
        console.error('Error resetting exam:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get live exam analytics
// @route   GET /api/exams/:id/analytics
// @access  Private (Teacher/Admin)
export const getExamAnalytics = async (req: AuthRequest, res: Response) => {
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

        // Adaptive-specific stats
        const adaptiveStats = {
            easy: { correct: 0, total: 0 },
            medium: { correct: 0, total: 0 },
            hard: { correct: 0, total: 0 },
            totalQuestionsServed: 0
        };

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

                    // Track adaptive stats if applicable
                    if (exam.isAdaptive && (ans.questionId as any).difficulty) {
                        const diff = (ans.questionId as any).difficulty as 'easy' | 'medium' | 'hard';
                        if (adaptiveStats[diff]) {
                            adaptiveStats[diff].total++;
                            if (ans.isCorrect) adaptiveStats[diff].correct++;
                        }
                    }
                }
            }
            if (exam.isAdaptive) {
                adaptiveStats.totalQuestionsServed += resDoc.answers.length;
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
        // Filter out questions gracefully that were never answered to prevent skewed Toughest/Easiest
        const validQuestions = [...questionAnalysis].filter(q => q.totalAnswered > 0);
        const sortedAnalysis = validQuestions.sort((a, b) => a.accuracy - b.accuracy);
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
            } : null,
            isAdaptive: exam.isAdaptive,
            adaptiveStats: exam.isAdaptive ? {
                ...adaptiveStats,
                averageQuestionsPerStudent: finishedCount > 0 ? (adaptiveStats.totalQuestionsServed / finishedCount) : 0
            } : null
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Log proctoring violation
// @route   POST /api/exams/:id/violation
// @access  Private (Student)
export const logViolation = async (req: AuthRequest, res: Response) => {
    try {
        const { id: examId } = req.params;
        const studentId = req.user._id;
        const { type, message, snapshot, transcript } = req.body;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found.' });
        }

        // Server-side rate limiting: reject violations within 2s of each other
        const recentViolation = await Violation.findOne(
            { studentId, examId },
            { timestamp: 1 },
            { sort: { timestamp: -1 } }
        );
        if (recentViolation && (Date.now() - new Date(recentViolation.timestamp).getTime() < 2000)) {
            // Silently accept but don't increment - client is flooding
            const sessionValue = await ExamSession.findOne({ studentId, examId, status: 'in-progress' });
            return res.json({
                violationCount: sessionValue?.violationCount || 0,
                isSuspended: sessionValue?.isSuspended || false,
                threshold: exam.proctoringConfig?.violationThreshold || 5
            });
        }

        // 1. Create Violation Log (with optional snapshot + transcript evidence)
        await Violation.create({
            studentId,
            examId,
            type,
            message,
            ...(snapshot ? { snapshot } : {}),
            ...(transcript ? { transcript } : {})
        });

        // 2. Atomic increment to prevent race conditions at scale
        const threshold = exam.proctoringConfig?.violationThreshold || 5;
        const session = await ExamSession.findOneAndUpdate(
            { studentId, examId, status: 'in-progress', isSuspended: false },
            { $inc: { violationCount: 1 } },
            { new: true } // return updated document
        );

        if (!session) {
            // If session not found or already suspended, fetch it to return current status
            const currentSession = await ExamSession.findOne({ studentId, examId });
            return res.status(200).json({
                violationCount: currentSession?.violationCount || 0,
                isSuspended: currentSession?.isSuspended || false,
                threshold
            });
        }

        // 3. Check for Auto-Suspension (post-increment)
        if (session.violationCount >= threshold) {
            session.isSuspended = true;
            await session.save();

            // Real-time notification to proctors
            const io = getIO();
            io.to(examId).emit('student-suspended', {
                studentId,
                examId,
                studentName: req.user.name,
                reason: `Reached violation threshold of ${threshold}`
            });
            io.to('global-proctor-room').emit('student-suspended', {
                studentId,
                examId,
                studentName: req.user.name,
                reason: `Reached violation threshold of ${threshold}`
            });

            // Global notification for staff bells
            io.to('global-proctor-room').emit('staff-notification', {
                type: 'suspension',
                title: 'Student Suspended',
                message: `${req.user.name} has been suspended for exceeding ${threshold} violations.`,
                timestamp: new Date()
            });
        }

        res.json({
            violationCount: session.violationCount,
            isSuspended: session.isSuspended,
            threshold
        });
    } catch (error: any) {
        console.error(`[VIOLATION LOG ERROR] Student: ${req.user?._id}, Exam: ${req.params.id}`, error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resume a suspended student session
// @route   POST /api/exams/:id/resume/:studentId
// @access  Private (Teacher/Admin/Proctor)
export const resumeStudentSession = async (req: AuthRequest, res: Response) => {
    try {
        const { id: examId, studentId } = req.params;

        const [exam, session] = await Promise.all([
            Exam.findById(examId),
            ExamSession.findOne({ studentId, examId })
        ]);

        if (!exam || !session) {
            return res.status(404).json({ message: 'Exam or session not found.' });
        }

        if (!session.isSuspended && session.status === 'in-progress') {
            return res.status(400).json({ message: 'Session is not suspended.' });
        }

        // 1. Delete the auto-submitted result if it exists
        await Result.findOneAndDelete({ studentId, examId });

        // 2. Reset session state
        session.isSuspended = false;
        session.status = 'in-progress';

        // Give the student one more chance if they were at the threshold
        const threshold = exam.proctoringConfig?.violationThreshold || 5;
        if (session.violationCount >= threshold) {
            session.violationCount = threshold - 1;
        }

        await session.save();

        // 3. Notify student via Socket
        const io = getIO();
        io.to(examId).emit('student-unsuspended', {
            studentId,
            examId,
            message: 'Your exam session has been resumed by a proctor.'
        });

        res.json({ message: 'Session resumed successfully.', session });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get global proctoring stats
// @route   GET /api/exams/proctor/global-stats
// @access  Private (Teacher/Admin/Proctor)
export const getGlobalProctorStats = async (req: AuthRequest, res: Response) => {
    try {
        const [activeExams, globalActiveSessions] = await Promise.all([
            Exam.find({ 
                status: 'published', 
                endTime: { $gt: new Date() } 
            }).select('_id'),
            ExamSession.find({ status: 'in-progress' }).select('examId')
        ]);

        const activeExamIds = activeExams.map(e => e._id);
        
        // Final Security Filter for Proctors/Teachers
        let targetExamIds = activeExamIds;
        if (req.user.role === 'proctor') {
            const assignedExams = await Exam.find({ proctors: req.user._id, status: 'published', endTime: { $gt: new Date() } }).select('_id');
            targetExamIds = assignedExams.map(e => e._id);
        } else if (req.user.role === 'teacher') {
            const createdExams = await Exam.find({ creatorId: req.user._id, status: 'published', endTime: { $gt: new Date() } }).select('_id');
            targetExamIds = createdExams.map(e => e._id);
        }

        const [activeCount, violationCount, suspensionCount] = await Promise.all([
            ExamSession.countDocuments({ status: 'in-progress', examId: { $in: targetExamIds } }),
            Violation.countDocuments({ examId: { $in: targetExamIds } }),
            ExamSession.countDocuments({ isSuspended: true, examId: { $in: targetExamIds }, status: 'in-progress' })
        ]);

        res.json({
            totalActive: activeCount,
            totalViolations: violationCount,
            totalSuspensions: suspensionCount
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get violations for an exam
// @route   GET /api/exams/:id/violations
// @access  Private (Teacher/Admin/Proctor)
export const getExamViolations = async (req: AuthRequest, res: Response) => {
    try {
        const { id: examId } = req.params;

        // Security check for proctors and teachers
        if (req.user.role === 'proctor' && examId !== 'all') {
            const exam = await Exam.findById(examId);
            if (!exam) return res.status(404).json({ message: 'Exam not found.' });
            if (!exam.proctors?.some(p => p.toString() === req.user._id.toString())) {
                return res.status(403).json({ message: 'Access denied. You are not assigned to proctor this exam.' });
            }
        } else if (req.user.role === 'teacher' && examId !== 'all') {
            const exam = await Exam.findById(examId);
            if (!exam) return res.status(404).json({ message: 'Exam not found.' });
            if (exam.creatorId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Access denied. You are not the creator of this exam.' });
            }
        }

        let query: any = examId === 'all' ? {} : { examId };

        if (examId === 'all') {
            // Requirement: Exclusively show violations from ongoing exams
            const now = new Date();
            let ongoingExamQuery: any = {
                status: 'published',
                endTime: { $gt: now }
            };

            if (req.user.role === 'proctor') {
                ongoingExamQuery.proctors = req.user._id;
            } else if (req.user.role === 'teacher') {
                ongoingExamQuery.creatorId = req.user._id;
            }

            const ongoingExams = await Exam.find(ongoingExamQuery).select('_id');
            query.examId = { $in: ongoingExams.map(e => e._id) };
        }
    
        const violations = await Violation.find(query)
            .populate({
                path: 'studentId',
                select: 'name rollNo email groupId subgroupId',
                populate: { path: 'groupId', select: 'name' }
            })
            .populate('examId', 'title')
            .sort({ timestamp: -1 })
            .limit(1000) // Increased for proctoring vision
            .lean();

        // Cross-reference with sessions for the 'Action Status' HUD requirement
        const studentIds = violations.map(v => (v.studentId as any)?._id || v.studentId);
        const activeSessions = await ExamSession.find({ 
            studentId: { $in: studentIds },
            examId: { $in: violations.map(v => (v.examId as any)?._id || v.examId) }
        }).select('studentId examId isSuspended').lean();

        const sessionMapValue = new Map();
        activeSessions.forEach((s: any) => {
            sessionMapValue.set(`${s.studentId.toString()}-${s.examId.toString()}`, s.isSuspended);
        });

        const enhancedViolations = violations.map(v => ({
            ...v,
            isSuspended: sessionMapValue.get(`${((v.studentId as any)?._id || v.studentId).toString()}-${((v.examId as any)?._id || v.examId).toString()}`) || false
        }));

        res.json(enhancedViolations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get violations for a specific student in an exam
// @route   GET /api/exams/:id/violations/:studentId
// @access  Private (Teacher/Admin/Proctor)
export const getStudentViolations = async (req: AuthRequest, res: Response) => {
    try {
        const { id: examId, studentId } = req.params;

        // Security check for proctors and teachers
        if (req.user.role === 'proctor') {
            const exam = await Exam.findById(examId);
            if (!exam) return res.status(404).json({ message: 'Exam not found.' });
            if (!exam.proctors?.some(p => p.toString() === req.user._id.toString())) {
                return res.status(403).json({ message: 'Access denied. You are not assigned to proctor this exam.' });
            }
        } else if (req.user.role === 'teacher') {
            const exam = await Exam.findById(examId);
            if (!exam) return res.status(404).json({ message: 'Exam not found.' });
            if (exam.creatorId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Access denied. You are not the creator of this exam.' });
            }
        }

        const violations = await Violation.find({ examId, studentId })
            .sort({ timestamp: 1 }); // Chronological order for timeline
        res.json(violations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active sessions for an exam
// @route   GET /api/exams/:id/active-sessions
// @access  Private (Teacher/Admin/Proctor)
export const getActiveSessions = async (req: AuthRequest, res: Response) => {
    try {
        const { id: examId } = req.params;
        let query: any = {};
        
        if (examId !== 'all') {
            // Security check for proctors and teachers
            if (req.user.role === 'proctor') {
                const exam = await Exam.findById(examId);
                if (!exam || !exam.proctors?.some(p => p.toString() === req.user._id.toString())) {
                    return res.status(403).json({ message: 'Access denied.' });
                }
            } else if (req.user.role === 'teacher') {
                const exam = await Exam.findById(examId);
                if (!exam || exam.creatorId.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ message: 'Access denied.' });
                }
            }
            // Focused Mode: Show all sessions (Live + Stored)
            query.examId = examId;
        } else {
            // Global Mode: Only show active/ongoing candidates from ONGOING exams
            const now = new Date();
            let ongoingExamQuery: any = {
                status: 'published',
                endTime: { $gt: now }
            };

            if (req.user.role === 'proctor') {
                ongoingExamQuery.proctors = req.user._id;
            } else if (req.user.role === 'teacher') {
                ongoingExamQuery.creatorId = req.user._id;
            }

            const ongoingExams = await Exam.find(ongoingExamQuery).select('_id');
            const ongoingExamIds = ongoingExams.map(e => e._id);

            query.$and = [
                { examId: { $in: ongoingExamIds } },
                {
                    $or: [
                        { status: 'in-progress' },
                        { isSuspended: true }
                    ]
                }
            ];
        }

        const sessions = await ExamSession.find(query)
            .populate({
                path: 'studentId',
                select: 'name rollNo email groupId',
                populate: { path: 'groupId', select: 'name' }
            })
            .populate('examId', 'title')
            .lean();

        // Enhance with real-time HUD fields (isOnline, violationScore alias)
        const enhancedSessions = sessions.map(s => {
            const lastSync = s.lastSyncTime ? new Date(s.lastSyncTime).getTime() : 0;
            const now = Date.now();
            return {
                ...s,
                id: s._id,
                studentName: (s.studentId as any)?.name || 'Unknown Candidate',
                examTitle: (s.examId as any)?.title || 'Unknown Exam',
                isOnline: (now - lastSync) < 60000, // Sync within last 60 seconds
                violationScore: s.violationCount || 0, // Frontend alias
                // Mock device status if missing (for VISION compatibility)
                devices: (s as any).devices || { camera: true, screen: true, audio: true }
            };
        });

        res.json(enhancedSessions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get cheating analysis for all exams
// @route   GET /api/exams/proctor/cheating-analysis
// @access  Private (Teacher/Admin/Proctor)
export const getCheatingAnalysis = async (req: AuthRequest, res: Response) => {
    try {
        let matchQuery: any = {};
        if (req.user.role === 'proctor') {
            matchQuery.proctors = req.user._id;
        } else if (req.user.role === 'teacher') {
            matchQuery.creatorId = req.user._id;
        }

        const stats = await Exam.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'examsessions',
                    localField: '_id',
                    foreignField: 'examId',
                    as: 'activeSessions'
                }
            },
            {
                $lookup: {
                    from: 'results',
                    localField: '_id',
                    foreignField: 'examId',
                    as: 'finalResults'
                }
            },
            {
                $addFields: {
                    sessionVol: { $sum: '$activeSessions.violationCount' },
                    sessionSusp: { $size: { $filter: { input: '$activeSessions', as: 's', cond: { $eq: ['$$s.isSuspended', true] } } } },
                    resultSusp: { $size: { $filter: { input: '$finalResults', as: 'r', cond: { $eq: ['$$r.isSuspended', true] } } } },
                    totalParticipants: { $add: [{ $size: '$activeSessions' }, { $size: '$finalResults' }] }
                }
            },
            {
                $project: {
                    examId: '$_id',
                    examTitle: '$title',
                    totalParticipants: 1,
                    activeParticipants: { $size: '$activeSessions' },
                    completedParticipants: { $size: '$finalResults' },
                    suspensions: { $add: ['$sessionSusp', '$resultSusp'] },
                    totalViolations: '$sessionVol',
                    flaggedStudents: {
                        $size: {
                            $setUnion: [
                                { $map: { input: { $filter: { input: '$activeSessions', as: 's', cond: { $gt: ['$$s.violationCount', 0] } } }, as: 's', in: '$$s.studentId' } },
                                { $map: { input: { $filter: { input: '$finalResults', as: 'r', cond: { $eq: ['$$r.isSuspended', true] } } }, as: 'r', in: '$$r.studentId' } }
                            ]
                        }
                    },
                    lastIncidentAt: { $max: ['$updatedAt', '$activeSessions.lastSyncTime'] }
                }
            },
            { $sort: { totalParticipants: -1 } }
        ]);

        // Global Summary
        const globalStats = stats.reduce((acc, curr) => ({
            totalParticipants: acc.totalParticipants + curr.totalParticipants,
            totalViolations: acc.totalViolations + curr.totalViolations,
            totalSuspensions: acc.totalSuspensions + curr.suspensions
        }), { totalParticipants: 0, totalViolations: 0, totalSuspensions: 0 });

        const integrityScore = globalStats.totalParticipants > 0 
            ? Math.max(0, 100 - (globalStats.totalViolations / globalStats.totalParticipants) * 10) 
            : 100;

        res.json({
            exams: stats,
            global: {
                totalParticipants: globalStats.totalParticipants,
                totalViolations: globalStats.totalViolations,
                totalSuspensions: globalStats.totalSuspensions,
                integrityScore: Math.round(integrityScore),
                systemEfficacy: globalStats.totalViolations > 0 ? Math.round((globalStats.totalSuspensions / globalStats.totalViolations) * 100) : 100
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get violation frequency (by hour/type)
// @route   GET /api/exams/proctor/violation-trends
// @access  Private (Teacher/Admin/Proctor)
export const getViolationTrends = async (req: AuthRequest, res: Response) => {
    try {
        let matchQuery: any = {};
        if (req.user.role === 'proctor') {
            const assignedExams = await Exam.find({ proctors: req.user._id }).select('_id');
            matchQuery.examId = { $in: assignedExams.map(e => e._id) };
        } else if (req.user.role === 'teacher') {
            const createdExams = await Exam.find({ creatorId: req.user._id }).select('_id');
            matchQuery.examId = { $in: createdExams.map(e => e._id) };
        }

        const trends = await Violation.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        type: '$type',
                        hour: { $hour: '$timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: '$_id.type',
                    hour: '$_id.hour',
                    count: 1
                }
            },
            { $sort: { hour: 1 } }
        ]);

        res.json(trends);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Clone an existing exam (Template feature)
// @route   POST /api/exams/:id/clone
// @access  Private (Teacher/Admin)
export const cloneExam = async (req: AuthRequest, res: Response) => {
    try {
        const originalExam = await Exam.findById(req.params.id).populate('questions');
        if (!originalExam) {
            return res.status(404).json({ message: 'Original exam not found.' });
        }

        // Deep clone questions if it's a structural clone
        // For C.A.T exams, we usually want new AI-generated questions, but for standard exams we copy refs
        let newQuestionIds = originalExam.questions;
        if (!originalExam.isAdaptive) {
             // Optional: Create fresh copies of questions to avoid cross-exam reference issues
             const clonedQs = await Question.insertMany(
                 (originalExam.questions as any[]).map(q => {
                     const qObj = q.toObject();
                     delete qObj._id;
                     delete qObj.createdAt;
                     delete qObj.updatedAt;
                     return { ...qObj, creatorId: req.user._id };
                 })
             );
             newQuestionIds = clonedQs.map(q => q._id);
        } else {
            // Adaptive: We only copy the config, let the pipeline generate new ones
            newQuestionIds = [];
        }

        const clonedExam = await Exam.create({
            title: `Copy of ${originalExam.title}`,
            description: originalExam.description,
            questions: newQuestionIds,
            duration: originalExam.duration,
            startTime: new Date(Date.now() + 86400000), // Default to +1 day
            endTime: new Date(Date.now() + 86400000 + (originalExam.duration * 60000)),
            status: 'draft',
            allowedGroups: originalExam.allowedGroups,
            allowedSubgroups: originalExam.allowedSubgroups,
            proctoringConfig: originalExam.proctoringConfig,
            isAdaptive: originalExam.isAdaptive,
            adaptiveConfig: originalExam.adaptiveConfig,
            creatorId: req.user._id,
            autoComplete: originalExam.autoComplete,
            gracePeriod: originalExam.gracePeriod
        });

        // Trigger adaptive generation if needed
        if (clonedExam.isAdaptive && clonedExam.adaptiveConfig) {
            triggerAdaptiveGeneration(clonedExam, clonedExam.adaptiveConfig, req.user);
        }

        res.status(201).json(clonedExam);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk update proctor assignments
// @route   PUT /api/exams/proctor/bulk-assign
// @access  Private (Admin)
export const bulkAssignProctors = async (req: Request, res: Response) => {
    try {
        const { examIds, proctorIds } = req.body;

        if (!Array.isArray(examIds) || !Array.isArray(proctorIds)) {
            return res.status(400).json({ message: 'Invalid input. Arrays required.' });
        }

        // Verify proctors exist and have correct role
        const validProctors = await User.find({
            _id: { $in: proctorIds },
            role: 'proctor'
        }).select('_id');

        const validProctorIds = validProctors.map(p => p._id);

        await Exam.updateMany(
            { _id: { $in: examIds } },
            { $set: { proctors: validProctorIds } }
        );

        res.json({ message: `Successfully assigned ${validProctorIds.length} proctors to ${examIds.length} exams.` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export exam results to CSV
// @route   GET /api/exams/:id/export
// @access  Private (Teacher/Admin)
export const exportResults = async (req: AuthRequest, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        const results = await Result.find({ examId: req.params.id })
            .populate('studentId', 'name email rollNo')
            .lean();

        if (results.length === 0) {
            return res.status(400).json({ message: 'No results to export' });
        }

        const fields = [
            { label: 'Roll Number', value: 'studentId.rollNo' },
            { label: 'Student Name', value: 'studentId.name' },
            { label: 'Email', value: 'studentId.email' },
            { label: 'Score', value: 'score' },
            { label: 'Total Points', value: 'totalPoints' },
            { label: 'Grading Status', value: 'gradingStatus' },
            { label: 'Submission Time', value: 'createdAt' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(results);

        res.header('Content-Type', 'text/csv');
        res.attachment(`${exam.title.replace(/\s+/g, '_')}_Results.csv`);
        return res.send(csv);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get next question for adaptive exam
// @route   POST /api/exams/:id/adaptive/next
// @access  Private (Student)
// @desc    Download cheating report for an exam
// @route   GET /api/exams/:id/cheating-report
// @access  Private (Teacher/Admin/Proctor)
export const downloadCheatingReport = async (req: AuthRequest, res: Response) => {
    try {
        const { id: examId } = req.params;

        // 1. Security check for proctors and teachers (similar to getExamViolations)
        if (req.user.role === 'proctor' && examId !== 'all') {
            const exam = await Exam.findById(examId);
            if (!exam || !exam.proctors?.some(p => p.toString() === req.user._id.toString())) {
                return res.status(403).json({ message: 'Access denied.' });
            }
        }

        // 2. Build Query
        let query: any = examId === 'all' ? {} : { examId };
        
        if (examId === 'all') {
            if (req.user.role === 'proctor') {
                const assignedExams = await Exam.find({ proctors: req.user._id }).select('_id');
                query.examId = { $in: assignedExams.map(e => e._id) };
            } else if (req.user.role === 'teacher') {
                const createdExams = await Exam.find({ creatorId: req.user._id }).select('_id');
                query.examId = { $in: createdExams.map(e => e._id) };
            }
        }

        // 3. Fetch Data with full population
        const [violations, sessions] = await Promise.all([
            Violation.find(query)
                .populate({
                    path: 'studentId',
                    select: 'name email rollNo groupId',
                    populate: { path: 'groupId', select: 'name' }
                })
                .populate('examId', 'title')
                .sort({ timestamp: -1 })
                .lean(),
            ExamSession.find({ ...query, isSuspended: true }).select('studentId examId').lean()
        ]);

        if (violations.length === 0) {
            return res.status(404).json({ message: 'No violations found.' });
        }

        // Composite key for suspension: studentId_examId
        const suspendedKeys = new Set(sessions.map(s => `${s.studentId.toString()}_${s.examId.toString()}`));

        // 4. Map to CSV Data
        const data = violations.map((v: any) => {
            const vStudentId = v.studentId?._id?.toString() || v.studentId?.toString();
            const vExamId = v.examId?._id?.toString() || v.examId?.toString();
            const isSuspended = suspendedKeys.has(`${vStudentId}_${vExamId}`);

            return {
                ExamTitle: v.examId?.title || 'Unknown',
                StudentName: v.studentId?.name || 'Unknown',
                RollNo: v.studentId?.rollNo || 'N/A',
                Email: v.studentId?.email || 'N/A',
                Group: v.studentId?.groupId?.name || 'N/A',
                ViolationType: v.type,
                Message: v.message,
                Timestamp: new Date(v.timestamp).toLocaleString(),
                SessionStatus: isSuspended ? 'DISQUALIFIED (SUSPENDED)' : 'ACTIVE/COMPLETED'
            };
        });

        const fields = ['ExamTitle', 'StudentName', 'RollNo', 'Email', 'Group', 'ViolationType', 'Message', 'Timestamp', 'SessionStatus'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        const filename = examId === 'all' 
            ? `Global_Forensic_Report_${new Date().toISOString().split('T')[0]}.csv`
            : `Cheating_Report_Exam_${(violations[0].examId as any)?.title?.replace(/\s+/g, '_') || examId}.csv`;

        res.header('Content-Type', 'text/csv');
        res.attachment(filename);
        res.status(200).send(csv);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// ADAPTIVE CONTENT ENGINE (C.A.T.) - Round 4
// ==========================================

// @desc    Get next adaptive question for a student
// @route   GET /api/exams/:id/adaptive/next
// @access  Private (Student)
export const getNextAdaptiveQuestion = async (req: AuthRequest, res: Response) => {
    try {
        const examId = req.params.id;
        const studentId = req.user._id;

        const [exam, session] = await Promise.all([
            Exam.findById(examId).populate('questions'),
            ExamSession.findOne({ studentId, examId, status: 'in-progress' })
        ]);

        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (!exam.isAdaptive) return res.status(400).json({ message: 'This exam is not adaptive.' });
        if (!session) return res.status(404).json({ message: 'Active session not found.' });

        // Robust adaptiveState initialization
        if (!session.adaptiveState) {
            session.adaptiveState = { 
                currentDifficulty: 'medium', 
                questionsServed: [], 
                trailingCorrect: 0, 
                trailingTotal: 0 
            };
            await session.save();
        }
        
        const adaptiveState = session.adaptiveState;
        const maxQuestions = exam.adaptiveConfig?.questionsPerStudent || 15;

        // Resumption Logic: If the last served question wasn't answered, re-serve it.
        if (adaptiveState.questionsServed.length > 0) {
            const lastServedId = adaptiveState.questionsServed[adaptiveState.questionsServed.length - 1];
            
            // Standardize map vs object access for answers
            const answers = (session.answers instanceof Map) 
                ? session.answers 
                : new Map(Object.entries(session.answers || {}));
                
            if (!answers.has(lastServedId.toString())) {
                const lastQuestion = (exam.questions as any[]).find(q => q && q._id && q._id.toString() === lastServedId.toString());
                if (lastQuestion) {
                    return res.json({
                        _id: lastQuestion._id,
                        text: lastQuestion.text,
                        options: lastQuestion.options,
                        type: lastQuestion.type || 'mcq',
                        difficulty: lastQuestion.difficulty,
                        questionNumber: adaptiveState.questionsServed.length,
                        totalQuestions: maxQuestions,
                        currentDifficulty: adaptiveState.currentDifficulty,
                        stats: {
                            answered: adaptiveState.trailingTotal,
                            correct: adaptiveState.trailingCorrect
                        }
                    });
                }
            }
        }

        // Filter out null/undefined entries that can occur if populated docs were deleted or malformed
        const validQuestions = (exam.questions as any[]).filter((q: any) => q && q._id && q.text);

        // Check if question pool is still being generated or has failed
        if (validQuestions.length === 0) {
            if (exam.generationStatus === 'failed') {
                return res.status(200).json({
                    error: true,
                    message: 'AI question generation failed. Please ask the teacher to re-publish this exam.'
                });
            }
            return res.json({
                generating: true,
                message: exam.generationStatus === 'generating'
                    ? 'AI is preparing the question pool. This takes ~30-60s. Please wait...'
                    : 'Question pool is initializing. Please wait...',
                totalQuestions: maxQuestions
            });
        }

        // Check if student has reached the question limit
        if (adaptiveState.questionsServed.length >= maxQuestions) {
            return res.json({ completed: true, message: 'All adaptive questions served.', totalServed: adaptiveState.questionsServed.length });
        }

        // Filter pool by current difficulty, excluding already-served questions
        const servedIds = new Set(adaptiveState.questionsServed.map((id: any) => id.toString()));
        const availableQuestions = validQuestions.filter(
            (q: any) => q.difficulty === adaptiveState.currentDifficulty && !servedIds.has(q._id.toString())
        );

        let selectedQuestion: any = null;

        if (availableQuestions.length > 0) {
            // Pick a random question from the available pool
            selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        } else {
            // Fallback: pick from any difficulty
            const fallback = validQuestions.filter((q: any) => !servedIds.has(q._id.toString()));
            if (fallback.length > 0) {
                selectedQuestion = fallback[Math.floor(Math.random() * fallback.length)];
            }
        }

        if (!selectedQuestion) {
            // If no questions served yet, pool is still synchronizing (not truly exhausted)
            if (adaptiveState.questionsServed.length === 0) {
                return res.json({
                    generating: true,
                    message: 'Question pool is synchronizing. Please wait...',
                    totalQuestions: maxQuestions
                });
            }
            return res.json({ completed: true, message: 'Question pool exhausted.', totalServed: adaptiveState.questionsServed.length });
        }

        // Add to served list
        adaptiveState.questionsServed.push(selectedQuestion._id);
        session.markModified('adaptiveState');
        await session.save();

        // Sanitize: strip correct answer before sending to student
        const sanitized = {
            _id: selectedQuestion._id,
            text: selectedQuestion.text,
            options: selectedQuestion.options,
            type: selectedQuestion.type || 'mcq',
            difficulty: selectedQuestion.difficulty,
            questionNumber: adaptiveState.questionsServed.length,
            totalQuestions: maxQuestions,
            currentDifficulty: adaptiveState.currentDifficulty,
            stats: {
                answered: adaptiveState.trailingTotal,
                correct: adaptiveState.trailingCorrect
            }
        };

        res.json(sanitized);
    } catch (error: any) {
        console.error('[C.A.T.] getNextAdaptiveQuestion Error:', error);
        res.status(500).json({ message: 'Internal server error while fetching next question.', error: error.message });
    }
};

// @desc    Submit answer for an adaptive question and get difficulty adjustment
// @route   POST /api/exams/:id/adaptive/answer
// @access  Private (Student)
export const submitAdaptiveAnswer = async (req: AuthRequest, res: Response) => {
    try {
        const examId = req.params.id;
        const studentId = req.user._id;
        const { questionId, selectedOption, textAnswer } = req.body;

        const [exam, session] = await Promise.all([
            Exam.findById(examId).populate('questions'),
            ExamSession.findOne({ studentId, examId, status: 'in-progress' })
        ]);

        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (!session) return res.status(404).json({ message: 'Active session not found.' });

        // Find the question
        const question = (exam.questions as any[]).find((q: any) => q._id.toString() === questionId);
        if (!question) return res.status(404).json({ message: 'Question not found in pool.' });

        // Security Hardening: Verify if this question was actually the last one served
        const adaptiveState = (session as any).adaptiveState || { currentDifficulty: 'medium', questionsServed: [], trailingCorrect: 0, trailingTotal: 0 };
        const lastServedId = adaptiveState.questionsServed[adaptiveState.questionsServed.length - 1];

        if (!lastServedId || lastServedId.toString() !== questionId) {
            return res.status(403).json({ message: 'Validation failed: You can only submit an answer for the question currently served.' });
        }

        // Integrity Check: Prevent resubmission if answer already exists in session
        const sessionAnswers = session.answers ? (session.answers instanceof Map ? session.answers : new Map(Object.entries(session.answers))) : new Map();
        if (sessionAnswers.has(questionId)) {
            return res.status(400).json({ message: 'Answer already submitted for this question.' });
        }

        let isCorrect = false;
        let aiFeedback = '';
        let evalResult: any = { missingConcepts: [], remediationSteps: [] };

        if (question.type === 'descriptive') {
            try {
                const questionPoints = question.points || 10;
                const finalAnswer = textAnswer || '';

                // Security: Length validation
                if (finalAnswer.length > 10000) {
                    return res.status(400).json({ message: 'Answer exceeds maximum allowed length (10,000 chars).' });
                }

                evalResult = await evaluateDescriptiveAnswer(
                    finalAnswer,
                    question.referenceAnswer || '',
                    question.text,
                    questionPoints
                );
                // Difficulty climbing threshold: 70% of max points
                isCorrect = (evalResult.score || 0) >= (questionPoints * 0.7);
                aiFeedback = evalResult.feedback || 'AI evaluated your descriptive response.';
            } catch (e) {
                console.error('AI Evaluation failed in adaptive mode:', e);
                isCorrect = true; // Neutral fallback to prevent stalling
                aiFeedback = 'Manual review required.';
            }
        } else {
            isCorrect = question.correctAnswer === selectedOption;
        }

        // Update session answers map
        sessionAnswers.set(questionId, question.type === 'descriptive' ? textAnswer : selectedOption);
        session.answers = sessionAnswers;

        adaptiveState.trailingTotal++;

        if (isCorrect) {
            adaptiveState.trailingCorrect++;
        } else {
            adaptiveState.trailingCorrect = 0; // Reset streak on wrong answer
        }

        // Difficulty transitions
        const difficultyLevels = ['easy', 'medium', 'hard'] as const;
        const currentIdx = difficultyLevels.indexOf(adaptiveState.currentDifficulty);

        if (adaptiveState.trailingCorrect >= 2 && currentIdx < 2) {
            // 2 consecutive correct → move UP
            adaptiveState.currentDifficulty = difficultyLevels[currentIdx + 1];
            adaptiveState.trailingCorrect = 0; // Reset streak after transition
        } else if (!isCorrect && currentIdx > 0) {
            // 1 wrong → move DOWN
            adaptiveState.currentDifficulty = difficultyLevels[currentIdx - 1];
        }

        // Cache evaluation result for final submission efficiency
        if (!session.evaluations) session.evaluations = new Map();
        session.evaluations.set(questionId, {
            score: isCorrect ? (question.points || 1) : 0, 
            isCorrect,
            feedback: aiFeedback,
            missingConcepts: evalResult.missingConcepts || [],
            remediationSteps: evalResult.remediationSteps || []
        });

        // For specific descriptive score persistence
        if (question.type === 'descriptive') {
            const currentEval = session.evaluations.get(questionId);
            if (currentEval) currentEval.score = evalResult.score || 0;
        }

        (session as any).adaptiveState = adaptiveState;
        session.markModified('adaptiveState');
        session.markModified('answers');
        session.markModified('evaluations');
        await session.save();

        res.json({
            isCorrect,
            newDifficulty: adaptiveState.currentDifficulty,
            questionsAnswered: adaptiveState.trailingTotal,
            totalQuestions: exam.adaptiveConfig?.questionsPerStudent || 15
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

