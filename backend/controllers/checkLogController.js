import CheckLog from '../models/CheckLog.js';
import Pass from '../models/Pass.js';

// @desc    Scan QR Code — auto-detects check-in vs check-out
// @route   POST /api/checklogs/scan
// @access  Private (Security/Admin)
export const scanAndLog = async (req, res) => {
  try {
    const { qrCodeData } = req.body;

    const pass = await Pass.findOne({ qrCodeData }).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email' },
        { path: 'host', select: 'name' }
      ]
    });

    if (!pass) {
      return res.status(404).json({ message: 'Invalid QR code — pass not found' });
    }

    const now = new Date();
    if (now < new Date(pass.validFrom) || now > new Date(pass.validUntil)) {
      return res.status(400).json({ message: 'Pass is expired or not yet valid' });
    }

    if (pass.appointment.status !== 'Approved') {
      return res.status(400).json({ message: 'Appointment is not approved' });
    }

    // Check for an active check-in (no check-out yet)
    const activeLog = await CheckLog.findOne({ pass: pass._id, checkOutTime: { $exists: false } });

    if (activeLog) {
      // Perform check-out
      activeLog.checkOutTime = now;
      await activeLog.save();
      pass.status = 'Used';
      await pass.save();

      return res.json({
        type: 'checkout',
        message: 'Check-Out Successful',
        log: activeLog,
        visitorName: pass.appointment.visitor?.name
      });
    } else {
      if (pass.status === 'Used') {
        return res.status(400).json({ message: 'Pass has already been used for a complete visit' });
      }

      const newLog = await CheckLog.create({
        pass: pass._id,
        securityPersonnel: req.user._id,
        checkInTime: now
      });

      return res.json({
        type: 'checkin',
        message: 'Check-In Successful',
        log: newLog,
        visitorName: pass.appointment.visitor?.name
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all check logs
// @route   GET /api/checklogs
// @access  Private (Admin/Security)
export const getCheckLogs = async (req, res) => {
  try {
    const logs = await CheckLog.find({})
      .sort({ createdAt: -1 })
      .populate('securityPersonnel', 'name')
      .populate({
        path: 'pass',
        populate: {
          path: 'appointment',
          populate: [
            { path: 'visitor', select: 'name company' },
            { path: 'host', select: 'name' }
          ]
        }
      });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recent check logs (last 20)
// @route   GET /api/checklogs/recent
// @access  Private (Admin/Security)
export const getRecentLogs = async (req, res) => {
  try {
    const logs = await CheckLog.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('securityPersonnel', 'name')
      .populate({
        path: 'pass',
        populate: {
          path: 'appointment',
          populate: [
            { path: 'visitor', select: 'name company' },
            { path: 'host', select: 'name' }
          ]
        }
      });

    // Flatten for easy frontend consumption
    const formatted = logs.map(log => ({
      _id: log._id,
      type: log.checkOutTime ? 'checkout' : 'checkin',
      timestamp: log.checkOutTime || log.checkInTime,
      checkInTime: log.checkInTime,
      checkOutTime: log.checkOutTime,
      visitor: log.pass?.appointment?.visitor,
      appointment: log.pass?.appointment,
      securityPersonnel: log.securityPersonnel
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
