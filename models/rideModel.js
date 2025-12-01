const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
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
    status: {
      type: String,
      enum: ["pending", "accepted", "started", "arrived", "completed", "cancelled"],
      default: "pending",
    },
    cancelledBy: {
      type: String,
      enum: ["passenger", "driver"],
    },
    cancellationReason: String,
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    passengerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    driverReview: String,
    passengerReview: String,
    
    // Payment and fare
    distance: Number, // in km
    duration: Number, // in minutes
    fare: Number, // Base fare before discounts
    paymentMethod: {
      type: String,
      enum: ["cash", "wallet", "card"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    
    // New fields for passenger app features
    stops: [
      {
        address: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        order: Number, // 1, 2, 3... for sequence
      },
    ],
    vehicleType: {
      type: String,
      enum: ["economy", "comfort", "premium"],
      default: "economy",
    },
    voucherCode: String,
    voucherDiscount: {
      type: Number,
      default: 0,
    },
    walletAmountUsed: {
      type: Number,
      default: 0,
    },
    finalFare: Number, // After voucher and wallet deduction
    
    // Scheduled Ride
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledTime: Date, // When the ride should start
    
    // Round Trip
    isRoundTrip: {
      type: Boolean,
      default: false,
    },
    returnRideId: {
      type: mongoose.Schema.ObjectId,
      ref: "Ride",
    },
    
    // Rating Tags
    driverRatingTags: [String], // e.g., ["Great Service", "Clean Car"]
    passengerRatingTags: [String],
    
    // Structured Cancel Reason
    cancellationReasonCode: {
      type: String,
      enum: [
        "driver_late",
        "changed_mind",
        "wrong_pickup",
        "found_another_ride",
        "passenger_no_show",
        "emergency",
        "other"
      ],
    },
    
    acceptedAt: Date,
    startedAt: Date,
    arrivedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

// Indexes for performance
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ passenger: 1, status: 1 });
rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ "pickupLocation.coordinates": "2dsphere" });

module.exports = mongoose.model("Ride", rideSchema);
