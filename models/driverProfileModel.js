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
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    profileCompletionCheckedAt: Date,

    rejectionReason: String,
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  const baseUrl = process.env.BASE_URL;
  const fields = [
    'licenseFront', 'licenseBack', 
    'carRegFront', 'carRegBack', 
    'nationalIdFront', 'nationalIdBack'
  ];

  fields.forEach(field => {
    if (doc[field] && !doc[field].startsWith('http')) {
      doc[field] = `${baseUrl}/uploads/drivers/${doc[field]}`;
    }
  });

  if (doc.carPhotos && doc.carPhotos.length > 0) {
    doc.carPhotos = doc.carPhotos.map(photo => {
      if (photo && !photo.startsWith('http')) {
        return `${baseUrl}/uploads/drivers/${photo}`;
      }
      return photo;
    });
  }
};

driverProfileSchema.post("init", setImageURL);
driverProfileSchema.post("save", setImageURL);

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
