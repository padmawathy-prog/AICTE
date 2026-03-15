const mongoose = require('mongoose');

const IncomingRequestSchema = new mongoose.Schema({
  postedRequest:   { type: mongoose.Schema.Types.ObjectId, ref: 'PostedRequest', required: true },
  targetDonor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  patientName:     { type: String, required: true },
  bloodRequired:   { type: String, required: true },
  hospital:        { type: String, required: true },
  location:        { type: String, required: true },
  urgency:         { type: String, default: 'High' },
  contact:         { type: String, required: true },
  notes:           { type: String, default: '' },
  requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requesterEmail:  { type: String, default: '' },
  status:          { type: String, enum: ['pending','accepted','donated','rejected'], default: 'pending' },
  acceptedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('IncomingRequest', IncomingRequestSchema);