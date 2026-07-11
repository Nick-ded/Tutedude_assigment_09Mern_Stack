import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  company: {
    type: String
  },
  photoUrl: {
    type: String // path to local uploaded photo
  }
}, {
  timestamps: true
});

const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;
