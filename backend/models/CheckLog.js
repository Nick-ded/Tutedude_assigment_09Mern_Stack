import mongoose from 'mongoose';

const checkLogSchema = new mongoose.Schema({
  pass: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Pass'
  },
  securityPersonnel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date
  }
}, {
  timestamps: true
});

const CheckLog = mongoose.model('CheckLog', checkLogSchema);
export default CheckLog;
