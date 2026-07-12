import Appointment from '../models/Appointment.js';
import Pass from '../models/Pass.js';
import Visitor from '../models/Visitor.js';
import crypto from 'crypto';
import { sendAppointmentRequestEmail, sendPassEmail } from '../utils/sendEmail.js';

// @desc    Create appointment (logged-in host)
// @route   POST /api/appointments
// @access  Private
export const createAppointment = async (req, res) => {
  try {
    const { visitorId, purpose, expectedDate } = req.body;

    const appointment = await Appointment.create({
      host: req.user._id,
      visitor: visitorId,
      purpose,
      expectedDate,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Visitor self pre-registration
// @route   POST /api/appointments/pre-register
// @access  Public
export const preRegisterVisitor = async (req, res) => {
  try {
    const { name, email, phone, company, hostEmail, purpose, scheduledDate, notes } = req.body;

    // Find or create visitor record
    let visitor = await Visitor.findOne({ email });
    if (!visitor) {
      visitor = await Visitor.create({ name, email, phone, company });
    } else {
      visitor.name    = name;
      visitor.phone   = phone;
      visitor.company = company;
      await visitor.save();
    }

    if (req.file) {
      visitor.photoUrl = req.file.path;
      await visitor.save();
    }

    // Resolve host by email
    const User = (await import('../models/User.js')).default;
    const host = await User.findOne({ email: hostEmail });
    if (!host) {
      return res.status(404).json({ message: 'Host not found with that email' });
    }

    const appointment = await Appointment.create({
      host:         host._id,
      visitor:      visitor._id,
      purpose,
      expectedDate: new Date(scheduledDate),
      notes:        notes || '',
    });

    // Notify host via email (non-blocking)
    sendAppointmentRequestEmail({
      hostEmail:     host.email,
      hostName:      host.name,
      visitorName:   visitor.name,
      purpose,
      scheduledDate: appointment.expectedDate,
    });

    res.status(201).json({
      message: 'Pre-registration successful. Awaiting host approval.',
      appointmentId: appointment._id,
      visitor,
      appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get appointments (all for Admin/Security, own for Employee)
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    const query = (req.user.role === 'Admin' || req.user.role === 'Security')
      ? {}
      : { host: req.user._id };

    const appointments = await Appointment.find(query)
      .populate('host',    'name email')
      .populate('visitor', 'name email phone company')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve appointment and issue QR pass
// @route   PUT /api/appointments/:id/approve
// @access  Private (Admin or host)
export const approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('host',    'name email')
      .populate('visitor', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.host._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to approve this appointment' });
    }

    appointment.status = 'Approved';
    await appointment.save();

    // Generate cryptographically unique QR token
    const qrCodeData = crypto.randomBytes(20).toString('hex');
    const validFrom  = appointment.expectedDate;
    const validUntil = new Date(new Date(validFrom).getTime() + 24 * 60 * 60 * 1000);

    const pass = await Pass.create({
      appointment: appointment._id,
      qrCodeData,
      validFrom,
      validUntil,
    });

    // Email QR pass to visitor (non-blocking)
    sendPassEmail({
      visitorEmail:  appointment.visitor.email,
      visitorName:   appointment.visitor.name,
      hostName:      appointment.host.name,
      purpose:       appointment.purpose,
      scheduledDate: appointment.expectedDate,
      qrCodeData,
      passId:        pass._id,
    });

    res.json({ appointment, pass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject appointment
// @route   PUT /api/appointments/:id/reject
// @access  Private (Admin or host)
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
