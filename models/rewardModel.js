const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    period: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    totalRides: {
      type: Number,
      required: true,
    },
    rewardAmount: {
      type: Number,
      required: true,
    },
    bonusPoints: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "distributed", "claimed"],
      default: "pending",
    },
    distributedAt: Date,
    claimedAt: Date,
  },
  { timestamps: true }
);

// Indexes
rewardSchema.index({ driver: 1, createdAt: -1 });
rewardSchema.index({ period: 1, periodStart: 1 });
rewardSchema.index({ status: 1 });

module.exports = mongoose.model("Reward", rewardSchema);
