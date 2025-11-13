const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    licenseFront: String,
    licenseBack: String,
    carRegFront: String,
    carRegBack: String,
    nationalIdFront: String,
    nationalIdBack: String,
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    carPhotos: {
  type: [String],
  default: [],
},

    rejectionReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
