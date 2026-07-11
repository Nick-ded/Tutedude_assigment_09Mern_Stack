import Visitor from '../models/Visitor.js';

// @desc    Register a visitor (simple, for internal staff use)
// @route   POST /api/visitors
// @access  Public or Private (Employee)
export const registerVisitor = async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;

    const existing = await Visitor.findOne({ email });
    if (existing) {
      return res.status(400).json({
        message: 'Visitor already registered with this email',
        visitor: existing
      });
    }

    const visitor = await Visitor.create({
      name,
      email,
      phone,
      company,
      photoUrl: req.file ? req.file.path : undefined
    });

    res.status(201).json(visitor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all visitors
// @route   GET /api/visitors
// @access  Private (Admin/Security)
export const getVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({}).sort({ createdAt: -1 });
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
