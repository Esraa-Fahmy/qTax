// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, required: true, unique: true }, // +2010...
  firebaseUID: { type: String, unique: true, sparse: true }, // بعد verify من Firebase
  role: { type: String, enum: ['rider','driver','admin'], default: 'rider' },
  status: { type: String, enum: ['pending','rejected','active'], default: 'active' }, 
  profileImg: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
