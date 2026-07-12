import Pass from '../models/Pass.js';
import QRCode from 'qrcode';
import { generatePassPDF } from '../utils/generatePassPDF.js';

// @desc    Get pass by appointment ID
// @route   GET /api/passes/appointment/:appointmentId
// @access  Private
export const getPassByAppointment = async (req, res) => {
  try {
    const pass = await Pass.findOne({ appointment: req.params.id });
    if (!pass) return res.status(404).json({ message: 'No pass for this appointment' });
    res.json(pass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pass details + base64 QR image
// @route   GET /api/passes/:id
// @access  Private
export const getPassById = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email phone company photoUrl' },
        { path: 'host',    select: 'name email' },
      ],
    });

    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    const qrCodeImage = await QRCode.toDataURL(pass.qrCodeData);
    res.json({ pass, qrCodeImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download pass as PDF
// @route   GET /api/passes/:id/pdf
// @access  Private
export const downloadPassPDF = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email phone company' },
        { path: 'host',    select: 'name email' },
      ],
    });

    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    const { visitor, host, purpose, expectedDate } = pass.appointment;

    const pdfBuffer = await generatePassPDF({
      visitorName:    visitor.name,
      visitorEmail:   visitor.email,
      visitorPhone:   visitor.phone,
      visitorCompany: visitor.company,
      hostName:       host.name,
      purpose,
      scheduledDate:  expectedDate,
      qrCodeData:     pass.qrCodeData,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pass-${visitor.name.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify pass by QR code data
// @route   POST /api/passes/verify
// @access  Private (Security/Admin)
export const verifyPass = async (req, res) => {
  try {
    const { qrCodeData } = req.body;

    const pass = await Pass.findOne({ qrCodeData }).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email phone company photoUrl' },
        { path: 'host',    select: 'name email' },
      ],
    });

    if (!pass) return res.json({ isValid: false, message: 'Pass not found' });

    const now = new Date();
    if (now > new Date(pass.validUntil))
      return res.json({ isValid: false, message: 'Pass has expired', pass });

    if (pass.status !== 'Active')
      return res.json({ isValid: false, message: `Pass is ${pass.status.toLowerCase()}`, pass });

    if (pass.appointment.status !== 'Approved')
      return res.json({ isValid: false, message: 'Appointment is not approved', pass });

    res.json({
      isValid:     true,
      message:     'Pass is valid',
      pass,
      visitor:     pass.appointment.visitor,
      appointment: pass.appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
