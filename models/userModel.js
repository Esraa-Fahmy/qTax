const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  email: { type: String, lowercase: true },
phone: {
  type: String,
  required: function () {
    return this.role !== "admin"; // ✅ مش مطلوب لو أدمن
  },
  unique: true,
  sparse: true, // ✅ يسمح بتكرار القيمة null أو عدم وجود الحقل
},

  profileImg: String,

  isPhoneVerified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["user", "driver", "admin"],
    default: "user",
    required: true,
  },
  password : 
  {
type: String,
minlength: 4,
select: false

  }
,
  status: {
    type: String,
    enum: ["pending", "active", "rejected"],
    default: "pending",
  },

  driverProfile: {
    type: mongoose.Schema.ObjectId,
    ref: "DriverProfile",
  },

  // Driver-specific fields
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date,
  },
  earnings: {
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  totalRides: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  
  // Driver settings
  autoAcceptRequests: { type: Boolean, default: false },
  pickupRadius: { type: Number, default: 5 }, // in km
  fcmToken: String, // For push notifications

  // Passenger-specific fields
  savedAddresses: [
    {
      label: {
        type: String,
        enum: ["home", "work", "favorite"],
      },
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
  ],

  // Temporary fields for phone change verification
  tempPhone: String,
  tempPhoneOTP: String,
  tempPhoneOTPExpires: Date,

}, { timestamps: true });




const setImageURL = (doc) => {
  if (doc.profileImg && !doc.profileImg.startsWith('http')) {
    doc.profileImg = `${process.env.BASE_URL}/uploads/users/${doc.profileImg}`;
  }
};

userSchema.post("init", setImageURL);
userSchema.post("save", setImageURL);

module.exports = mongoose.model("User", userSchema);
