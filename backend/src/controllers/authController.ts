import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { z } from 'zod';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Generate JWT Token
const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
    const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['student', 'teacher', 'admin', 'proctor']).optional(),
        institution: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
    }

    const { name, email, password, role, institution } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            institution
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error: any) {
        try {
            fs.appendFileSync('error_log.txt', `Register Error: ${error.message}\nStack: ${error.stack}\n`);
        } catch (e) {
            console.error('Failed to write to error log:', e);
        }
        res.status(500).json({ message: error.message });
    }
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
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id.toString()),
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
