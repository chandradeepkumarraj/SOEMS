import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../../models/User';
import Exam from '../../models/Exam';
import Result from '../../models/Result';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('groupId', 'name')
            .populate('subgroupId', 'name academicYear')
            .populate('managedGroups', 'name')
            .populate('departmentProctors.groupId', 'name')
            .populate('departmentProctors.proctorId', 'name email');

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNo: user.rollNo,
                phoneNumber: user.phoneNumber,
                address: user.address,
                institution: user.institution,
                group: user.groupId,
                subgroup: user.subgroupId,
                defaultProctorId: (user as any).defaultProctorId,
                groupId: (user as any).groupId,
                managedGroups: (user as any).managedGroups,
                departmentProctors: (user as any).departmentProctors,
                proctoringPresets: (user as any).proctoringPresets,
                createdAt: user.createdAt
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Restrictions for students
            if (user.role === 'student') {
                user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
                // Students cannot change name, email, address, or rollNo via profile page
            } else {
                // Teachers/Admins can change more fields
                user.name = req.body.name || user.name;
                user.email = req.body.email || user.email;
                user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
                user.address = req.body.address !== undefined ? req.body.address : user.address;
                user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
                user.institution = req.body.institution !== undefined ? req.body.institution : user.institution;
                
                // ObjectId Validation for Audit & Integrity
                if (req.body.groupId) {
                    if (mongoose.Types.ObjectId.isValid(req.body.groupId)) {
                        (user as any).groupId = req.body.groupId;
                    } else {
                        return res.status(400).json({ message: 'Invalid Department ID' });
                    }
                } else {
                    (user as any).groupId = null;
                }

                if (req.body.defaultProctorId) {
                    if (mongoose.Types.ObjectId.isValid(req.body.defaultProctorId)) {
                        (user as any).defaultProctorId = req.body.defaultProctorId;
                    } else {
                        return res.status(400).json({ message: 'Invalid Proctor ID' });
                    }
                } else {
                    (user as any).defaultProctorId = null;
                }

                if (req.body.managedGroups && Array.isArray(req.body.managedGroups)) {
                    const validGroupIds = req.body.managedGroups.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
                    (user as any).managedGroups = validGroupIds;
                }

                if (req.body.departmentProctors && Array.isArray(req.body.departmentProctors)) {
                    const validMappings = req.body.departmentProctors
                        .filter((m: any) => m.groupId && m.proctorId && mongoose.Types.ObjectId.isValid(m.groupId) && mongoose.Types.ObjectId.isValid(m.proctorId))
                        .map((m: any) => ({
                            groupId: m.groupId,
                            proctorId: m.proctorId
                        }));
                    (user as any).departmentProctors = validMappings;
                }

                if (req.body.proctoringPresets) {
                    (user as any).proctoringPresets = { ...(user as any).proctoringPresets, ...req.body.proctoringPresets };
                }
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = (await user.save()).toObject();
            delete (updatedUser as any).password;

            res.json({
                ...updatedUser,
                groupId: (user as any).groupId,
                defaultProctorId: (user as any).defaultProctorId,
                managedGroups: (user as any).managedGroups,
                departmentProctors: (user as any).departmentProctors,
                proctoringPresets: (user as any).proctoringPresets
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get students for teacher
// @route   GET /api/users/my-students
// @access  Private (Teacher)
export const getMyStudents = async (req: any, res: Response) => {
    try {
        const teacherId = new mongoose.Types.ObjectId(req.user._id);

        // 1. Get exams created by this teacher
        const exams = await Exam.find({ creatorId: teacherId }).select('_id');
        const examIds = exams.map(e => e._id);

        if (examIds.length === 0) {
            return res.json([]);
        }

        // 2. Aggregate results to get student stats
        const studentStats = await Result.aggregate([
            { $match: { examId: { $in: examIds } } },
            {
                $group: {
                    _id: '$studentId',
                    examsTaken: { $sum: 1 },
                    totalScore: { $sum: '$score' },
                    totalPoints: { $sum: '$totalPoints' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: '$student' },
            {
                $project: {
                    _id: 1,
                    name: '$student.name',
                    email: '$student.email',
                    rollNo: '$student.rollNo',
                    examsTaken: 1,
                    totalScore: 1,
                    totalPoints: 1,
                    avgScore: {
                        $cond: [
                            { $gt: ['$totalPoints', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$totalScore', '$totalPoints'] }, 100] }, 0] },
                            0
                        ]
                    }
                }
            }
        ]);

        res.json(studentStats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all proctors
// @route   GET /api/users/proctors
// @access  Private (Teacher/Admin)
export const getProctors = async (req: Request, res: Response) => {
    try {
        const proctors = await User.find({ role: 'proctor' }).select('name email _id').sort({ name: 1 });
        res.json(proctors);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
