import express from 'express';
import { registerVisitor, getVisitors } from '../controllers/visitorController.js';
import { protect, securityOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(registerVisitor)
  .get(protect, securityOrAdmin, getVisitors);

export default router;
