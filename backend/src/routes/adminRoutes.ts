import express from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import { getUsers, createUser, deleteUser, importUsers, exportUsers, getSystemStats } from '../controllers/adminController';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer config for CSV upload
const storage = multer.diskStorage({
    destination(req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        cb(null, 'uploads/');
    },
    filename(req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: function (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
        const filetypes = /csv/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/plain';

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('CSV files only!'));
        }
    },
});

router.route('/users')
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

router.route('/users/export')
    .get(protect, admin, exportUsers);

router.route('/users/import')
    .post(protect, admin, upload.single('file'), importUsers);

router.route('/users/:id')
    .delete(protect, admin, deleteUser);

router.route('/system')
    .get(protect, admin, getSystemStats);

export default router;
