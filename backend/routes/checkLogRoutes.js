import express from 'express';
import { scanAndLog, getCheckLogs, getRecentLogs, exportLogsCSV } from '../controllers/checkLogController.js';
import { protect, securityOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/scan',    protect, securityOrAdmin, scanAndLog);
router.get('/export',  protect, securityOrAdmin, exportLogsCSV);
router.get('/recent',  protect, securityOrAdmin, getRecentLogs);
router.get('/',        protect, securityOrAdmin, getCheckLogs);

export default router;
