import Pass from '../models/Pass.js';
import QRCode from 'qrcode';

// @desc    Get pass details + QR image by pass ID
// @route   GET /api/passes/:id
// @access  Private
export const getPassById = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email phone company photoUrl' },
        { path: 'host', select: 'name email' }
      ]
    });

    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    const qrCodeImage = await QRCode.toDataURL(pass.qrCodeData);

    res.json({ pass, qrCodeImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify a pass by its QR code data string
// @route   POST /api/passes/verify
// @access  Private (Security/Admin)
export const verifyPass = async (req, res) => {
  try {
    const { qrCodeData } = req.body;

    const pass = await Pass.findOne({ qrCodeData }).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email phone company photoUrl' },
        { path: 'host', select: 'name email' }
      ]
    });

    if (!pass) {
      return res.json({ isValid: false, message: 'Pass not found' });
    }

    const now = new Date();

    if (now > new Date(pass.validUntil)) {
      return res.json({ isValid: false, message: 'Pass has expired', pass });
    }

    if (pass.status !== 'Active') {
      return res.json({ isValid: false, message: `Pass is ${pass.status.toLowerCase()}`, pass });
    }

    if (pass.appointment.status !== 'Approved') {
      return res.json({ isValid: false, message: 'Appointment is not approved', pass });
    }

    res.json({
      isValid: true,
      message: 'Pass is valid',
      pass,
      visitor: pass.appointment.visitor,
      appointment: pass.appointment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
