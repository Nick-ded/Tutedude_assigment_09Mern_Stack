import express from 'express';
import { getPassById, downloadPassPDF, verifyPass, getPassByAppointment } from '../controllers/passController.js';
import { protect, securityOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/verify',         protect, securityOrAdmin, verifyPass);
router.get('/appointment/:id', protect, getPassByAppointment);
router.get('/:id/pdf',         protect, downloadPassPDF);
router.get('/:id',             protect, getPassById);

export default router;
