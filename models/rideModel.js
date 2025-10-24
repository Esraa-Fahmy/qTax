const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ممكن تكون null لحد ما يتم match
  pickup: {
    coordinates: { type: [Number] }, // [lng, lat] => لسهولة استخدام GeoJSON
    address: String
  },
  destination: {
    coordinates: { type: [Number] },
    address: String
  },
  price: Number,
  status: { type: String, enum: ['requested','accepted','ongoing','completed','cancelled'], default: 'requested' },
  createdAt: { type: Date, default: Date.now }
});

rideSchema.index({ 'pickup.coordinates': '2dsphere' }); // للاستعلام عن الأقرب
module.exports = mongoose.model('Ride', rideSchema);
