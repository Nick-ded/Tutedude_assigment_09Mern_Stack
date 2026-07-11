import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Visitor'
  },
  purpose: {
    type: String,
    required: true
  },
  expectedDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
