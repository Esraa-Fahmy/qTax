// models/DriverProfile.js
const mongoose = require('mongoose');

const driverProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  licenseNumber: String,
  licenseImages: [{ url: String, publicId: String }], // وش و ظهر صور الرخصة
  idImages: [{ url: String, publicId: String }],      // صور البطاقة وش وظهر
  car: {
    model: String,
    plateNumber: String,
    color: String,
    photos: [{ url: String, publicId: String }]
  },
  driverImg: {
    type:String
  },
  isAvailable: { type: Boolean, default: false },
  verifiedAt: Date,
  verificationStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DriverProfile', driverProfileSchema);
