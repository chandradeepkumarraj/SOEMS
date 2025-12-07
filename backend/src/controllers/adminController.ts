import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { Parser } from 'json2csv';
import csv from 'csv-parser';
import fs from 'fs';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user (Teacher/Student)
// @route   POST /api/admin/users
// @access  Private (Admin)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export users to CSV
// @route   GET /api/admin/users/export
// @access  Private (Admin)
export const exportUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).lean();

        const fields = ['_id', 'name', 'email', 'role', 'createdAt'];
        const json2csvParser = new Parser({ fields });
        const csvData = json2csvParser.parse(users);

        res.header('Content-Type', 'text/csv');
        res.attachment('users.csv');
        res.send(csvData);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Import users from CSV
// @route   POST /api/admin/users/import
// @access  Private (Admin)
export const importUsers = async (req: any, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results: any[] = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            // Process results
            let addedCount = 0;
            let errors = [];

            for (const row of results) {
                try {
                    // Expect CSV columns: name, email, password, role
                    const { name, email, password, role } = row;

                    if (!name || !email || !password) continue;

                    const exists = await User.exists({ email });
                    if (exists) continue;

                    await User.create({
                        name,
                        email,
                        password: password, // Pre-hashed or let model handle it? Model handles it.
                        role: role || 'student'
                    });
                    addedCount++;
                } catch (err: any) {
                    errors.push(err.message);
                }
            }

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.json({
                message: `Imported ${addedCount} users successfully`,
                totalProcessed: results.length,
                errors: errors.length > 0 ? errors : undefined
            });
        });
};

// @desc    Get System Health Stats
// @route   GET /api/admin/system
// @access  Private (Admin)
export const getSystemStats = async (req: Request, res: Response) => {
    try {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        // Check DB connection
        // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        const dbStatus = require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected';

        res.json({
            uptime,
            dbStatus,
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            },
            timestamp: new Date()
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset any user's password (Admin only)
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin)
export const adminResetUserPassword = async (req: Request, res: Response) => {
    try {
        const { newPassword } = req.body;
        const userId = req.params.id;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
