import Appointment from '../models/Appointment.js';
import Pass from '../models/Pass.js';
import Visitor from '../models/Visitor.js';
import crypto from 'crypto';

// @desc    Create an appointment (by a logged-in host/employee)
// @route   POST /api/appointments
// @access  Private
export const createAppointment = async (req, res) => {
  try {
    const { visitorId, purpose, expectedDate } = req.body;
    const hostId = req.user._id;

    const appointment = await Appointment.create({
      host: hostId,
      visitor: visitorId,
      purpose,
      expectedDate
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Visitor self-registers with appointment request
// @route   POST /api/appointments/pre-register
// @access  Public
export const preRegisterVisitor = async (req, res) => {
  try {
    const { name, email, phone, company, hostEmail, purpose, scheduledDate, expectedDuration, notes } = req.body;

    // Find or create visitor
    let visitor = await Visitor.findOne({ email });
    if (!visitor) {
      visitor = await Visitor.create({ name, email, phone, company });
    } else {
      // Update details in case they changed
      visitor.name = name;
      visitor.phone = phone;
      visitor.company = company;
      await visitor.save();
    }

    // Handle uploaded photo
    if (req.file) {
      visitor.photoUrl = req.file.path;
      await visitor.save();
    }

    // Find host by email
    const User = (await import('../models/User.js')).default;
    const host = await User.findOne({ email: hostEmail });
    if (!host) {
      return res.status(404).json({ message: 'Host not found with that email' });
    }

    const appointment = await Appointment.create({
      host: host._id,
      visitor: visitor._id,
      purpose,
      expectedDate: new Date(scheduledDate),
      notes: notes || ''
    });

    res.status(201).json({
      message: 'Pre-registration successful. Awaiting host approval.',
      appointmentId: appointment._id,
      visitor,
      appointment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all appointments (Admin/Security) or host's own appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    let appointments;
    if (req.user.role === 'Admin' || req.user.role === 'Security') {
      appointments = await Appointment.find({})
        .populate('host', 'name email')
        .populate('visitor', 'name email phone company')
        .sort({ createdAt: -1 });
    } else {
      appointments = await Appointment.find({ host: req.user._id })
        .populate('host', 'name email')
        .populate('visitor', 'name email phone company')
        .sort({ createdAt: -1 });
    }
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve appointment & auto-issue a pass
// @route   PUT /api/appointments/:id/approve
// @access  Private (Admin or the host)
export const approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.host.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to approve this appointment' });
    }

    appointment.status = 'Approved';
    await appointment.save();

    // Generate unique QR token
    const qrCodeData = crypto.randomBytes(20).toString('hex');

    // Valid from scheduled time for 24 hours
    const validFrom = appointment.expectedDate;
    const validUntil = new Date(new Date(validFrom).getTime() + 24 * 60 * 60 * 1000);

    const pass = await Pass.create({
      appointment: appointment._id,
      qrCodeData,
      validFrom,
      validUntil
    });

    res.json({ appointment, pass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject an appointment
// @route   PUT /api/appointments/:id/reject
// @access  Private (Admin or the host)
export const rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.host.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to reject this appointment' });
    }

    appointment.status = 'Rejected';
    await appointment.save();

    res.json({ message: 'Appointment rejected', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
