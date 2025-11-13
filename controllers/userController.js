const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const {uploadSingleImage} = require('../midlewares/uploadImageMiddleWare');

// Upload single image
exports.uploadUserImage = uploadSingleImage('profileImg');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {

    const path = "uploads/users/";
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
    await sharp(req.file.buffer)
      .toFormat('jpeg')
      .jpeg({ quality: 100 })
      .toFile(`uploads/users/${filename}`);

    // Save image into our db
    req.body.profileImg = filename;
  }

  next();
});



exports.getMyProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});


exports.updateMyProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['fullName', 'email', 'profileImg'];
  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field]) updates[field] = req.body[field];
  });

  const user = await User.findById(req.user._id);
  if (!user) return next(new ApiError('User not found', 404));

  // 📱 لو غيّر رقم الموبايل
  if (req.body.phone && req.body.phone !== user.phone) {
    user.phone = req.body.phone;
    user.isPhoneVerified = false;

    // ابعتي كود تحقق جديد
    await sendOtp(req.body.phone);

    await user.save();

    return res.status(200).json({
      status: 'pending_verification',
      message: 'Phone number updated. OTP sent for verification.',
    });
  }

  // ✏️ تحديث باقي البيانات العادية
  Object.assign(user, updates);
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: user,
  });
});


exports.verifyNewPhone = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return next(new ApiError('User not found', 404));

  const result = await verifyOtp(user.phone, code);
  if (result.status !== 'approved') {
    return next(new ApiError('Invalid or expired OTP', 400));
  }

  user.isPhoneVerified = true;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Phone verified successfully',
    data: user,
  });
});
