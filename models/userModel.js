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
  unique: function () {
    return this.role !== "admin"; // ✅ مش لازم يكون فريد لو أدمن
  },
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
}, { timestamps: true });




const setImageURL = (doc) => {
  if (doc.profileImg) {
    doc.profileImg = `${process.env.BASE_URL}/uploads/users/${doc.profileImg}`;
  }
};

userSchema.post("init", setImageURL);
userSchema.post("save", setImageURL);

module.exports = mongoose.model("User", userSchema);
