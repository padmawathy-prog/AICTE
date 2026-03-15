const mongoose = require('mongoose');

const PostedRequestSchema = new mongoose.Schema({
  patientName:     { type: String, required: true },
  bloodRequired:   { type: String, required: true },
  hospital:        { type: String, required: true },
  location:        { type: String, required: true },
  urgency:         { type: String, default: 'High' },
  contact:         { type: String, required: true },
  notes:           { type: String, default: '' },
  requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 
  targetDonor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  donorEmail:      { type: String, default: '' },
 status: { type: String, enum: ['pending','accepted','donated','rejected','blood_recieved'], default: 'pending' },
  acceptedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('PostedRequest', PostedRequestSchema);