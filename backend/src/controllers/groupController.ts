import { Request, Response } from 'express';
import Group from '../models/Group';
import Subgroup from '../models/Subgroup';
import User from '../models/User';

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

        // 1. Delete all subgroups for this group
        await Subgroup.deleteMany({ groupId: group._id });

        // 2. Unlink all users from this group (and subgroup)
        await User.updateMany(
            { groupId: group._id },
            { $set: { groupId: null, subgroupId: null } }
        );

        // 3. Delete the group
        await group.deleteOne();

        res.json({ message: 'Group and related data cleaned up' });
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

        // 1. Unlink all users from this subgroup
        await User.updateMany(
            { subgroupId: subgroup._id },
            { $set: { subgroupId: null } }
        );

        // 2. Delete the subgroup
        await subgroup.deleteOne();

        res.json({ message: 'Subgroup deleted and users updated' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
