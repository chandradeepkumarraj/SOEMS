import { Request, Response } from 'express';
import Group from '../models/Group';
import Subgroup from '../models/Subgroup';
import User from '../models/User';
import Exam from '../models/Exam';
import Result from '../models/Result';

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private (Admin)
export const getGroups = async (req: Request, res: Response) => {
    try {
        const groups = await Group.find({}).sort({ name: 1 });
        res.json(groups);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private (Admin)
export const createGroup = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const exists = await Group.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Group with this name already exists' });
        }
        const group = await Group.create({ name, description });
        res.status(201).json(group);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all subgroups (optionally filtered by groupId)
// @route   GET /api/groups/subgroups
// @access  Private (Admin)
export const getSubgroups = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.query;
        const filter = groupId ? { groupId } : {};
        const subgroups = await Subgroup.find(filter).populate('groupId', 'name').sort({ academicYear: -1, name: 1 });
        res.json(subgroups);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new subgroup
// @route   POST /api/groups/subgroups
// @access  Private (Admin)
export const createSubgroup = async (req: Request, res: Response) => {
    try {
        const { name, groupId, academicYear } = req.body;

        // Verify group exists
        const groupExists = await Group.findById(groupId);
        if (!groupExists) {
            return res.status(404).json({ message: 'Parent group not found' });
        }

        const exists = await Subgroup.findOne({ name, groupId, academicYear });
        if (exists) {
            return res.status(400).json({ message: 'Subgroup already exists for this group and year' });
        }

        const subgroup = await Subgroup.create({ name, groupId, academicYear });
        res.status(201).json(subgroup);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a group (and its subgroups, and unlink users)
// @route   DELETE /api/groups/:id
// @access  Private (Admin)
export const deleteGroup = async (req: Request, res: Response) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // 1. Get all subgroup IDs first for thorough cleanup
        const subgroups = await Subgroup.find({ groupId: group._id }, '_id');
        const subgroupIds = subgroups.map(s => s._id);

        // 2. Identify all students in this group before deleting them
        const usersInGroup = await User.find({ groupId: group._id }, '_id');
        const userIds = usersInGroup.map(u => u._id);

        // 3. Delete all results for these students
        if (userIds.length > 0) {
            await Result.deleteMany({ studentId: { $in: userIds } });
        }

        // 4. Delete all users (students) from this group
        // Note: We only delete students. Teachers/Admins are just unlinked if they happen to have a groupId (though usually they don't)
        await User.deleteMany({ groupId: group._id, role: 'student' });

        // 5. Unlink any non-student users (safety measure)
        await User.updateMany(
            { groupId: group._id },
            { $set: { groupId: null, subgroupId: null } }
        );

        // 6. Delete all subgroups for this group
        await Subgroup.deleteMany({ groupId: group._id });

        // 7. Remove group AND its subgroups from any Exam allowed list
        await Exam.updateMany(
            {
                $or: [
                    { allowedGroups: group._id },
                    { allowedSubgroups: { $in: subgroupIds } }
                ]
            },
            {
                $pull: {
                    allowedGroups: group._id,
                    allowedSubgroups: { $in: subgroupIds }
                }
            }
        );

        // 8. Delete the group
        await group.deleteOne();

        res.json({ message: 'Group, subgroups, students, and results cleaned up' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a subgroup (and unlink users)
// @route   DELETE /api/groups/subgroups/:id
// @access  Private (Admin)
export const deleteSubgroup = async (req: Request, res: Response) => {
    try {
        const subgroup = await Subgroup.findById(req.params.id);
        if (!subgroup) {
            return res.status(404).json({ message: 'Subgroup not found' });
        }

        // 1. Identify all students in this subgroup before deleting them
        const usersInSubgroup = await User.find({ subgroupId: subgroup._id }, '_id');
        const userIds = usersInSubgroup.map(u => u._id);

        // 2. Delete all results for these students
        if (userIds.length > 0) {
            await Result.deleteMany({ studentId: { $in: userIds } });
        }

        // 3. Delete all users (students) from this subgroup
        await User.deleteMany({ subgroupId: subgroup._id, role: 'student' });

        // 4. Unlink any non-student users (safety measure)
        await User.updateMany(
            { subgroupId: subgroup._id },
            { $set: { subgroupId: null } }
        );

        // 5. Remove subgroup from any Exam allowed list
        await Exam.updateMany(
            { allowedSubgroups: subgroup._id },
            { $pull: { allowedSubgroups: subgroup._id } }
        );

        // 6. Delete the subgroup
        await subgroup.deleteOne();

        res.json({ message: 'Subgroup, students, and results deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
