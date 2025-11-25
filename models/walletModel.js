const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["topup", "ride_payment", "refund", "withdrawal"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: String,
        rideId: {
          type: mongoose.Schema.ObjectId,
          ref: "Ride",
        },
        balanceBefore: Number,
        balanceAfter: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// No need for manual index - unique: true already creates one

module.exports = mongoose.model("Wallet", walletSchema);
