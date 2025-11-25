const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// @desc    Get user profile
// @route   GET /api/v1/passenger/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// @desc    Update profile (name, email, photo)
// @route   PUT /api/v1/passenger/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName, email } = req.body;

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (email) updateData.email = email;

  // Handle profile image upload
  if (req.file) {
    const fileName = `user-${req.user._id}-${Date.now()}.jpeg`;
    const uploadPath = path.join(__dirname, "../uploads/users", fileName);

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(uploadPath);

    // Delete old image if exists
    if (req.user.profileImg) {
      const oldFileName = req.user.profileImg.split("/").pop();
      const oldPath = path.join(__dirname, "../uploads/users", oldFileName);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    updateData.profileImg = fileName;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: user,
  });
});

// @desc    Request phone number change (sends OTP)
// @route   POST /api/v1/passenger/profile/change-phone/request
// @access  Private
exports.requestPhoneChange = asyncHandler(async (req, res, next) => {
  const { newPhone } = req.body;

  if (!newPhone) {
    return next(new ApiError("New phone number is required", 400));
  }

  // Check if phone already exists
  const existingUser = await User.findOne({ phone: newPhone });
  if (existingUser) {
    return next(new ApiError("Phone number already in use", 400));
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP temporarily (in production, use Redis or similar)
  // For now, we'll use a temporary field in the user model
  req.user.tempPhone = newPhone;
  req.user.tempPhoneOTP = otp;
  req.user.tempPhoneOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await req.user.save();

  // Send OTP via Twilio
  const twilio = require("twilio");
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    await client.messages.create({
      body: `Your qTax verification code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: newPhone,
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent to new phone number",
    });
  } catch (error) {
    return next(new ApiError("Failed to send OTP", 500));
  }
});

// @desc    Verify phone number change
// @route   POST /api/v1/passenger/profile/change-phone/verify
// @access  Private
exports.verifyPhoneChange = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new ApiError("OTP is required", 400));
  }

  const user = await User.findById(req.user._id);

  if (!user.tempPhone || !user.tempPhoneOTP) {
    return next(new ApiError("No phone change request found", 400));
  }

  if (Date.now() > user.tempPhoneOTPExpires) {
    return next(new ApiError("OTP has expired", 400));
  }

  if (user.tempPhoneOTP !== otp) {
    return next(new ApiError("Invalid OTP", 400));
  }

  // Update phone number
  user.phone = user.tempPhone;
  user.isPhoneVerified = true;
  user.tempPhone = undefined;
  user.tempPhoneOTP = undefined;
  user.tempPhoneOTPExpires = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Phone number updated successfully",
    data: {
      phone: user.phone,
    },
  });
});

// @desc    Save address (home, work, favorite)
// @route   POST /api/v1/passenger/addresses
// @access  Private
exports.saveAddress = asyncHandler(async (req, res, next) => {
  const { label, address, latitude, longitude } = req.body;

  if (!label || !address || !latitude || !longitude) {
    return next(new ApiError("All fields are required", 400));
  }

  if (!["home", "work", "favorite"].includes(label)) {
    return next(new ApiError("Label must be home, work, or favorite", 400));
  }

  const user = await User.findById(req.user._id);

  // Check if label already exists
  const existingIndex = user.savedAddresses.findIndex(
    (addr) => addr.label === label
  );

  if (existingIndex !== -1) {
    // Update existing
    user.savedAddresses[existingIndex] = {
      label,
      address,
      coordinates: { latitude, longitude },
    };
  } else {
    // Add new
    user.savedAddresses.push({
      label,
      address,
      coordinates: { latitude, longitude },
    });
  }

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Address saved successfully",
    data: user.savedAddresses,
  });
});

// @desc    Get saved addresses
// @route   GET /api/v1/passenger/addresses
// @access  Private
exports.getAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("savedAddresses");

  res.status(200).json({
    status: "success",
    results: user.savedAddresses.length,
    data: user.savedAddresses,
  });
});

// @desc    Delete saved address
// @route   DELETE /api/v1/passenger/addresses/:label
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const { label } = req.params;

  const user = await User.findById(req.user._id);

  user.savedAddresses = user.savedAddresses.filter(
    (addr) => addr.label !== label
  );

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Address deleted successfully",
    data: user.savedAddresses,
  });
});
