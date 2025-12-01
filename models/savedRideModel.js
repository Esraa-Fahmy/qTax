const mongoose = require("mongoose");

const savedRideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    }, // e.g., "Home to Work", "Recife"
    pickupLocation: {
      address: { type: String, required: true },
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
    },
    dropoffLocation: {
      address: { type: String, required: true },
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
    },
    stops: [
      {
        address: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        order: Number,
      },
    ],
    vehicleType: {
      type: String,
      enum: ["economy", "comfort", "premium"],
      default: "economy",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedRide", savedRideSchema);
