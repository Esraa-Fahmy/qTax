// controllers/authController.js
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { sendOtp, verifyOtp } = require("../utils/twilio");
const createToken = require("../utils/createToken");
const ApiError = require("../utils/apiError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); 

// helper function لتحديد نوع المستخدم من المسار
const getRoleFromPath = (req) => {
  if (req.originalUrl.includes("/driver")) return "driver";
  return "user";
};

// Helper function to filter driver-specific fields
const filterDriverFields = (userData) => {
  if (userData.role !== 'driver') {
    delete userData.earnings;
    delete userData.isOnline;
    delete userData.currentLocation;
    delete userData.autoAcceptRequests;
    delete userData.pickupRadius;
    delete userData.driverProfile;
  }
  
  // Hide savedAddresses from non-passengers
  if (userData.role !== 'user') {
    delete userData.savedAddresses;
  }
  
  delete userData.password; // Always remove password
  return userData;
};

// 📤 إرسال كود OTP باستخدام Twilio
exports.sendOtpCode = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;
  const role = getRoleFromPath(req);

  if (!phone) return next(new ApiError("Phone is required", 400));

  // Twilio هي اللي تبعت الكود فعليًا
  await sendOtp(phone);

  res.status(200).json({
    status: "success",
    message: `OTP sent to ${phone}`,
  });
});

// ✅ التحقق من الكود
exports.verifyOtpCode = asyncHandler(async (req, res, next) => {
  const { phone, code } = req.body;
  const role = getRoleFromPath(req);

  if (!phone || !code)
    return next(new ApiError("Phone and code are required", 400));

  // تحقق من الكود عن طريق Twilio
  const result = await verifyOtp(phone, code);

  if (result.status !== "approved") {
    return next(new ApiError("Invalid or expired OTP", 400));
  }

  // ✅ الكود صح — شوفي المستخدم ده
  let user = await User.findOne({ phone, role });
  let isFirstTime = false;

  if (!user) {
    user = await User.create({ phone, role, isPhoneVerified: true });
    isFirstTime = true;
  } else {
    user.isPhoneVerified = true;
    await user.save();
  }

  // 🎟️ أنشئي التوكن
  const token = createToken(user._id);

  // Convert to plain object using JSON
  const userData = JSON.parse(JSON.stringify(user));
  
  // Filter driver fields
  filterDriverFields(userData);

  res.status(200).json({
    status: "success",
    message: "Phone verified successfully",
    isFirstTime,
    data: userData,
    token,
  });
});

// controllers/adminAuthController.js

// 🔹 Register new admin (pending until approved)
exports.registerAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, password } = req.body;
  if (!email || !password) return next(new ApiError("Email and password are required", 400));

  const existing = await User.findOne({ email });
  if (existing) return next(new ApiError("Email already exists", 400));

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await User.create({
    fullName,
    email,
    phone: null,
    role: "admin",
    status: "pending",
    profileImg: null,
    password: hashedPassword,
  });

  res.status(201).json({
    status: "success",
    message: "Admin registered successfully. Awaiting approval from super admin.",
    data: admin,
  });
});

// 🔹 Login admin (only if approved)
exports.loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ApiError("Email and password are required", 400));

  const admin = await User.findOne({ email, role: "admin" }).select("+password");
  if (!admin) return next(new ApiError("Admin not found", 404));

  const match = await bcrypt.compare(password, admin.password || "");
  if (!match) return next(new ApiError("Incorrect password", 401));

  if (admin.status !== "active")
    return next(new ApiError("Your account is not approved yet", 403));

  const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  // Convert to plain object using JSON
  const adminData = JSON.parse(JSON.stringify(admin));
  
  // Filter driver fields
  filterDriverFields(adminData);

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
    data: adminData,
  });
});
