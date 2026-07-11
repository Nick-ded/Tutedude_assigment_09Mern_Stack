import mongoose from 'mongoose';

const passSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Appointment'
  },
  qrCodeData: {
    type: String, // String representation of the QR code or hash
    required: true,
    unique: true
  },
  pdfUrl: {
    type: String // URL or path to generated PDF pass
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Used'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const Pass = mongoose.model('Pass', passSchema);
export default Pass;
