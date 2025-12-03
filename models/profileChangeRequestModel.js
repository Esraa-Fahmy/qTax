const mongoose = require("mongoose");

const profileChangeRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["name", "phone", "email", "documents", "other"],
      required: true,
    },
    currentValue: String,
    requestedValue: String,
    reason: {
      type: String,
      required: true,
    },
    documents: [String], // URLs to uploaded documents if needed
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminResponse: String,
    reviewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  { timestamps: true }
);

// Indexes
profileChangeRequestSchema.index({ user: 1, status: 1 });
profileChangeRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ProfileChangeRequest", profileChangeRequestSchema);
