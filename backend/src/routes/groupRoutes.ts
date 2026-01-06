import express from 'express';
import { getGroups, createGroup, getSubgroups, createSubgroup, deleteGroup, deleteSubgroup } from '../controllers/groupController';
import { protect, teacher, admin } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(teacher, getGroups)
    .post(admin, createGroup);

router.delete('/:id', admin, deleteGroup);

router.route('/subgroups')
    .get(teacher, getSubgroups)
    .post(admin, createSubgroup);

router.delete('/subgroups/:id', admin, deleteSubgroup);

export default router;
