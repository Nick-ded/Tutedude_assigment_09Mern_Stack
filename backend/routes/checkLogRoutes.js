import express from 'express';
import { scanAndLog, getCheckLogs, getRecentLogs } from '../controllers/checkLogController.js';
import { protect, securityOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/scan', protect, securityOrAdmin, scanAndLog);
router.get('/recent', protect, securityOrAdmin, getRecentLogs);
router.get('/', protect, securityOrAdmin, getCheckLogs);

export default router;
