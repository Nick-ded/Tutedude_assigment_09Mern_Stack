import express from 'express';
import {
  createAppointment,
  preRegisterVisitor,
  getAppointments,
  approveAppointment,
  rejectAppointment
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

// Multer config for visitor photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const router = express.Router();

router.route('/')
  .get(protect, getAppointments)
  .post(protect, createAppointment);

// Public — visitor self pre-registration
router.post('/pre-register', upload.single('photo'), preRegisterVisitor);

router.put('/:id/approve', protect, approveAppointment);
router.put('/:id/reject', protect, rejectAppointment);

export default router;
