import express from 'express';
import { registerVisitor, getVisitors } from '../controllers/visitorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(registerVisitor)
  .get(protect, getVisitors);   // all authenticated staff can view visitors

export default router;
