import express from 'express';
import { getAiInsights } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/insights', protect, getAiInsights);

export default router;
