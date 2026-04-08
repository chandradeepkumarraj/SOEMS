import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import SystemConfig from '../../models/SystemConfig';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SERVER_CONFIG } from '../../config/serverConfig';

// Generate JWT Token
const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, SERVER_CONFIG.JWT_SECRET as string, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Check for maintenance mode
            const config = await (SystemConfig as any).getOrCreate();
            if (config.maintenanceMode && user.role !== 'admin') {
                return res.status(503).json({ 
                    message: 'System is currently under maintenance. Only administrators can login at this time.',
                    maintenance: true
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id.toString(), user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Setup Admin Security Questions (Admin Only)
// @route   POST /api/auth/setup-recovery
// @access  Private (Admin)
export const setupAdminRecovery = async (req: any, res: Response) => {
    try {
        const schema = z.object({
            questions: z.array(z.object({
                question: z.string().min(5),
                answer: z.string().min(1)
            })).length(3)
        });

        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
        }

        const { questions } = req.body; // Array of { question, answer }

        if (!questions || questions.length !== 3) {
            return res.status(400).json({ message: 'Please provide exactly 3 security questions' });
        }

        const user = await User.findById(req.user._id);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can set security questions' });
        }

        // Hash the answers before storing
        const hashedQuestions = await Promise.all(
            questions.map(async (q: any) => ({
                question: q.question,
                answer: await bcrypt.hash(q.answer.toLowerCase().trim(), 10),
            }))
        );

        user.securityQuestions = hashedQuestions;
        await user.save();

        res.json({ message: 'Security questions set successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Admin Password via Security Questions
// @route   POST /api/auth/reset-admin-password
// @access  Public
export const resetAdminPassword = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            email: z.string().email(),
            answers: z.array(z.string().min(1)).length(3),
            newPassword: z.string().min(6)
        });

        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
        }

        const { email, answers, newPassword } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.role !== 'admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!user.securityQuestions || user.securityQuestions.length !== 3) {
            return res.status(400).json({ message: 'Security questions not set up' });
        }

        if (!answers || answers.length !== 3) {
            return res.status(400).json({ message: 'Please provide answers to all 3 questions' });
        }

        // Verify all answers
        for (let i = 0; i < 3; i++) {
            const isMatch = await bcrypt.compare(
                answers[i].toLowerCase().trim(),
                user.securityQuestions[i].answer
            );
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect security answers' });
            }
        }

        // Reset password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get System Maintenance Status
 * @route   GET /api/auth/maintenance-status
 * @access  Public
 */
export const getMaintenanceStatus = async (req: Request, res: Response) => {
    try {
        const config = await (SystemConfig as any).getOrCreate();
        res.json({ 
            maintenanceMode: config.maintenanceMode 
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
