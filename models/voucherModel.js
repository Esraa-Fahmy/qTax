const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number, // For percentage type, max discount amount
    },
    minRideAmount: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 1, // How many times total can be used
    },
    usagePerUser: {
      type: Number,
      default: 1, // How many times per user
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        rideId: {
          type: mongoose.Schema.ObjectId,
          ref: "Ride",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    description: String,
  },
  { timestamps: true }
);

// Indexes (code index not needed - unique: true already creates one)
voucherSchema.index({ expiryDate: 1 });
voucherSchema.index({ isActive: 1 });

module.exports = mongoose.model("Voucher", voucherSchema);
