const mongoose = require("mongoose");

const vehicleTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vehicle type name is required"],
      unique: true,
      trim: true,
      enum: ["economy", "comfort", "premium"],
    },
    nameAr: {
      type: String,
      required: [true, "Arabic vehicle type name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionAr: {
      type: String,
      required: true,
      trim: true,
    },
    baseMultiplier: {
      type: Number,
      required: true,
      default: 1.0,
      min: 1.0,
    },
    passengerCapacity: {
      min: {
        type: Number,
        required: true,
        default: 1,
      },
      max: {
        type: Number,
        required: true,
        default: 4,
      },
    },
    image: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: [
      {
        feature: String,
        featureAr: String,
      },
    ],
  },
  { timestamps: true }
);

// Set image URL
const setImageURL = (doc) => {
  if (doc.image && !doc.image.startsWith('http')) {
    doc.image = `${process.env.BASE_URL}/uploads/vehicle-types/${doc.image}`;
  }
};

vehicleTypeSchema.post("init", setImageURL);
vehicleTypeSchema.post("save", setImageURL);

// Index for performance
vehicleTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model("VehicleType", vehicleTypeSchema);
