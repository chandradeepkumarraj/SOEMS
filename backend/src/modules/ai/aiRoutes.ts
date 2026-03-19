import express from 'express';
import { protect, teacher } from '../auth/authMiddleware';
import { getProviderStatus } from './aiService';
import { testAIConfig } from '../system/systemConfigController';

const router = express.Router();

/**
 * @desc    Get current AI provider status (Ollama/OpenAI/Gemini)
 * @route   GET /api/ai/status
 * @access  Private (Authenticated Users)
 */
router.get('/status', protect, async (req, res) => {
    try {
        const status = await getProviderStatus();
        res.json(status);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching AI status', error: error.message });
    }
});

/**
 * @desc    Test AI Provider Connection
 * @route   POST /api/ai/test-connection
 * @access  Private (Admin/Teacher)
 */
router.post('/test-connection', protect, teacher, testAIConfig);

export default router;
