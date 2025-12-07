import { Request, Response } from 'express';
import User from '../models/User';
import Exam from '../models/Exam';
import Result from '../models/Result';
import { z } from 'zod';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                phoneNumber: user.phoneNumber,
                address: user.address,
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
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
            user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
            user.address = req.body.address !== undefined ? req.body.address : user.address;
            user.avatarUrl = req.body.avatarUrl !== undefined ? req.body.avatarUrl : user.avatarUrl;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatarUrl: updatedUser.avatarUrl,
                bio: updatedUser.bio,
                phoneNumber: updatedUser.phoneNumber,
                address: updatedUser.address,
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
        const teacherId = req.user._id;
        // 1. Get exams by teacher
        const exams = await Exam.find({ creatorId: teacherId }).select('_id');
        const examIds = exams.map(e => e._id);

        // 2. Get results
        const results = await Result.find({ examId: { $in: examIds } }).populate('studentId', 'name email avatarUrl');

        // 3. Unique students + stats
        const studentStats = new Map();

        results.forEach((r: any) => {
            if (!r.studentId) return;
            const sId = r.studentId._id.toString();
            if (!studentStats.has(sId)) {
                studentStats.set(sId, {
                    _id: sId,
                    name: r.studentId.name,
                    email: r.studentId.email,
                    avatarUrl: r.studentId.avatarUrl,
                    examsTaken: 0,
                    totalScore: 0,
                    totalPoints: 0
                });
            }
            const stats = studentStats.get(sId);
            stats.examsTaken += 1;
            stats.totalScore += r.score;
            stats.totalPoints += r.totalPoints;
        });

        const students = Array.from(studentStats.values()).map(s => ({
            ...s,
            avgScore: s.totalPoints > 0 ? Math.round((s.totalScore / s.totalPoints) * 100) : 0
        }));

        res.json(students);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
