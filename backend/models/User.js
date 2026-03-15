const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  bloodGroup:  { type: String, required: true },
  city:        { type: String, default: '' },
  area:        { type: String, default: '' },
  location:    { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  role:        { type: String, default: 'donor' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);