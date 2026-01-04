import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { Parser } from 'json2csv';
import csv from 'csv-parser';
import fs from 'fs';
import { z } from 'zod';
import mongoose from 'mongoose';

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
        const { name, email, password, role, rollNo, phoneNumber, groupId, subgroupId } = req.body;

        const userExists = await User.findOne({
            $or: [
                { email },
                ...(rollNo && role === 'student' ? [{ rollNo }] : [])
            ]
        });
        if (userExists) {
            const conflict = userExists.email === email ? 'email' : 'roll number';
            return res.status(400).json({ message: `User with this ${conflict} already exists` });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            rollNo: rollNo || undefined,
            phoneNumber,
            groupId: groupId || undefined,
            subgroupId: subgroupId || undefined
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNo: user.rollNo,
                phoneNumber: user.phoneNumber
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

        const fields = ['_id', 'name', 'email', 'rollNo', 'role', 'createdAt'];
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

    const { groupId, subgroupId } = req.body;
    const results: any[] = [];
    const filePath = req.file.path;

    // Define validation schema for CSV row
    const studentSchema = z.object({
        name: z.string().min(2, "Name is too short"),
        email: z.string().email("Invalid email format"),
        rollNo: z.string().regex(/^\d{13}$/, "Roll No must be exactly 13 digits"),
        phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
        password: z.string().min(6).optional().default("Welcome@123"),
        role: z.literal('student').default('student')
    });

    const processImport = () => new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('error', (error) => reject(error))
            .on('end', async () => {
                let validUsers: any[] = [];
                let errorDetails: { row: number, name?: string, errors: string[] }[] = [];

                try {
                    // Pre-fetch existing emails and roll numbers for batch check
                    const emails = results.map(r => r.email).filter(Boolean);
                    const rollNos = results.map(r => r.rollNo).filter(Boolean);

                    const existingUsers = await User.find({
                        $or: [
                            { email: { $in: emails } },
                            { rollNo: { $in: rollNos } }
                        ]
                    }, 'email rollNo').lean();

                    const existingEmails = new Set(existingUsers.map(u => u.email));
                    const existingRollNos = new Set(existingUsers.map(u => u.rollNo));

                    for (let i = 0; i < results.length; i++) {
                        const row = results[i];
                        try {
                            // 1. Validate with Zod
                            const validation = studentSchema.safeParse(row);

                            if (!validation.success) {
                                errorDetails.push({
                                    row: i + 1,
                                    name: row.name || 'Unknown',
                                    errors: validation.error.errors.map(e => e.message)
                                });
                                continue;
                            }

                            const validatedData = validation.data;

                            // 2. Check for existence against pre-fetched data
                            const emailTaken = existingEmails.has(validatedData.email);
                            const rollTaken = existingRollNos.has(validatedData.rollNo);

                            if (emailTaken || rollTaken) {
                                errorDetails.push({
                                    row: i + 1,
                                    name: validatedData.name,
                                    errors: [emailTaken ? "Email already exists" : "Roll number already exists"]
                                });
                                continue;
                            }

                            // 3. Queue for batch creation
                            validUsers.push({
                                ...validatedData,
                                role: 'student', // Strictly enforce student role
                                groupId: groupId || undefined,
                                subgroupId: subgroupId || undefined
                            });

                        } catch (err: any) {
                            errorDetails.push({
                                row: i + 1,
                                name: row.name || 'Unknown',
                                errors: [err.message]
                            });
                        }
                    }

                    // 4. Batch Create
                    if (validUsers.length > 0) {
                        // Hash passwords before insertMany
                        const salt = await bcrypt.genSalt(10);
                        const processedUsers = await Promise.all(validUsers.map(async (u) => ({
                            ...u,
                            password: await bcrypt.hash(u.password, salt)
                        })));

                        await User.insertMany(processedUsers, { ordered: false });
                    }

                    resolve({ addedCount: validUsers.length, errorDetails, total: results.length });
                } catch (err) {
                    reject(err);
                }
            });
    });

    try {
        const result: any = await processImport();

        res.json({
            message: result.addedCount > 0 ? `Imported ${result.addedCount} users successfully` : "No users were imported",
            totalProcessed: result.total,
            addedCount: result.addedCount,
            errors: result.errorDetails.length > 0 ? result.errorDetails : undefined
        });
    } catch (error: any) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Error processing import: ' + error.message });
    } finally {
        // Clean up uploaded file
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fsErr) {
            console.error('Failed to delete temp file:', fsErr);
        }
    }
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
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

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
