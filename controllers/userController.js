const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const DriverProfile = require("../models/driverProfileModel");
const path = require("path");
const {uploadSingleImage} = require('../midlewares/uploadImageMiddleWare');
const { sendOtp, verifyOtp } = require("../utils/twilio");

// Upload single image
exports.uploadUserImage = uploadSingleImage('profileImg');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    const uploadsDir = path.join(__dirname, "../uploads/users/");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    await sharp(req.file.buffer)
      .toFormat('jpeg')
      .jpeg({ quality: 100 })
      .toFile(path.join(uploadsDir, filename));

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
    // ✅ تحقق إن الرقم مش مستخدم عند حد تاني
    const existingUser = await User.findOne({ phone: req.body.phone });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return next(new ApiError('Phone number already in use', 400));
    }

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




// Helper function لحذف الصور من السيرفر
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  
  // استخرجي اسم الملف من الـ URL
  const fileName = imagePath.split('/').pop();
  const filePath = path.join(__dirname, `../uploads/users/${fileName}`);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deleteDriverImages = (profile) => {
  if (!profile) return;
  
  const imagePaths = [
    profile.licenseFront,
    profile.licenseBack,
    profile.carRegFront,
    profile.carRegBack,
    profile.nationalIdFront,
    profile.nationalIdBack,
    ...(profile.carPhotos || [])
  ];
  
  imagePaths.forEach(imgPath => {
    if (imgPath) {
      const fileName = imgPath.split('/').pop();
      const filePath = path.join(__dirname, `../uploads/drivers/${fileName}`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
};

// 🗑️ حذف الحساب نهائيًا
exports.deleteMyAccount = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  // جيبي المستخدم
  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  // لو سواق، احذفي بروفايله وكل الصور المرتبطة
  if (user.role === "driver" && user.driverProfile) {
    const driverProfile = await DriverProfile.findById(user.driverProfile);
    
    if (driverProfile) {
      // احذفي كل صور السواق
      deleteDriverImages(driverProfile);
      
      // احذفي البروفايل من الداتابيز
      await DriverProfile.findByIdAndDelete(user.driverProfile);
    }
  }

  // احذفي صورة البروفايل الشخصية
  if (user.profileImg) {
    deleteImageFile(user.profileImg);
  }

  // 🔥 احذفي المستخدم نهائيًا
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    status: "success",
    message: "Your account has been permanently deleted. We're sorry to see you go!",
  });
});


// ✅ للأدمن: حذف أي حساب (تحديث للدالة الموجودة)
