import express from 'express';
import { uploadQuestionImage, uploadOptionImage } from '../../middleware/uploadMiddleware';
import { protect, teacher } from '../auth/authModule';

const router = express.Router();

// @route   POST /api/upload/question-image
// @access  Private (Teacher/Admin)
router.post('/question-image', protect, teacher, (req, res) => {
    uploadQuestionImage(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const relativePath = `/uploads/questions/${req.file.filename}`;
        res.json({ url: relativePath });
    });
});

// @route   POST /api/upload/option-image
// @access  Private (Teacher/Admin)
router.post('/option-image', protect, teacher, (req, res) => {
    uploadOptionImage(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const relativePath = `/uploads/questions/${req.file.filename}`;
        res.json({ url: relativePath });
    });
});

export default router;
