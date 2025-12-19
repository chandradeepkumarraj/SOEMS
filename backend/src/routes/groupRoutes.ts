import express from 'express';
import { getGroups, createGroup, getSubgroups, createSubgroup, deleteGroup, deleteSubgroup } from '../controllers/groupController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getGroups)
    .post(admin, createGroup);

router.delete('/:id', admin, deleteGroup);

router.route('/subgroups')
    .get(getSubgroups)
    .post(admin, createSubgroup);

router.delete('/subgroups/:id', admin, deleteSubgroup);

export default router;
