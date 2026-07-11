import express from 'express';
import { getPassById, verifyPass } from '../controllers/passController.js';
import { protect, securityOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/verify', protect, securityOrAdmin, verifyPass);
router.get('/:id', protect, getPassById);

export default router;
