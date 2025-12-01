const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "City name is required"],
      unique: true,
      trim: true,
    },
    nameAr: {
      type: String,
      required: [true, "Arabic city name is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // City-specific Pricing
    baseFare: { type: Number, required: true },
    pricePerKm: { type: Number, required: true },
    pricePerMinute: { type: Number, required: true },
    minFare: { type: Number, required: true },
    
    // Boundaries (Optional - for future geofencing)
    // We can store a center point and radius, or a polygon
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false
      }
    },
    radius: { type: Number, default: 10 }, // Coverage radius in km
  },
  { timestamps: true }
);

// Index for geospatial queries
citySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("City", citySchema);
