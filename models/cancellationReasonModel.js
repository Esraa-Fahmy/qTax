const mongoose = require("mongoose");

const cancellationReasonSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      required: [true, "Cancellation reason is required"],
      trim: true,
    },
    reasonAr: {
      type: String,
      required: [true, "Arabic cancellation reason is required"],
      trim: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["passenger", "driver"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for performance
cancellationReasonSchema.index({ userType: 1, isActive: 1, order: 1 });

module.exports = mongoose.model("CancellationReason", cancellationReasonSchema);
