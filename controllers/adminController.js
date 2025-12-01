const asyncHandler = require("express-async-handler");
const DriverProfile = require("../models/driverProfileModel");
const User = require("../models/userModel");
const Ride = require("../models/rideModel");
const ApiError = require("../utils/apiError");
const fs = require('fs');
const path = require("path");
const bcrypt = require("bcryptjs");

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


// 📋 Get all pending driver profiles
exports.getPendingDrivers = asyncHandler(async (req, res) => {
  const drivers = await DriverProfile.find({ verificationStatus: "pending" }).populate("user");
  res.status(200).json({ status: "success", results: drivers.length, data: drivers });
});

// ✅ Approve driver
exports.approveDriver = asyncHandler(async (req, res, next) => {
  const profile = await DriverProfile.findById(req.params.id);
  if (!profile) return next(new ApiError("Driver not found", 404));

  profile.verificationStatus = "approved";
  await profile.save();

  await User.findByIdAndUpdate(profile.user, { status: "active" });

  res.status(200).json({ status: "success", message: "Driver approved successfully." });
});

// ❌ Reject driver
exports.rejectDriver = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const profile = await DriverProfile.findById(req.params.id);
  if (!profile) return next(new ApiError("Driver not found", 404));

  profile.verificationStatus = "rejected";
  profile.rejectionReason = reason || "No reason provided";
  await profile.save();

  await User.findByIdAndUpdate(profile.user, { status: "rejected" });

  res.status(200).json({ status: "success", message: "Driver rejected.", reason });
});



exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { role, search, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: users.length,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    data: users,
  });
});

exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return next(new ApiError("User not found", 404));

  res.status(200).json({
    status: "success",
    data: user,
  });
});




exports.createDriverByAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone } = req.body;

  if (!phone) return next(new ApiError("Phone number is required", 400));

  // تأكدي ما يكونش موجود أصلاً
  const existing = await User.findOne({ phone });
  if (existing) return next(new ApiError("This driver already exists", 400));

  const driver = await User.create({
    fullName,
    email,
    phone,
    role: "driver",
    isPhoneVerified: true,
    status: "active",
  });

  // بروفايل السواق اتوافق عليه تلقائيًا
  const driverProfile = await DriverProfile.create({
    user: driver._id,
    verificationStatus: "approved",
  });

  driver.driverProfile = driverProfile._id;
  await driver.save();

  res.status(201).json({
    status: "success",
    message: "Driver created successfully and approved automatically.",
    data: { driver, driverProfile },
  });
});




// Approve or reject another admin
exports.updateAdminStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const admin = await User.findById(req.params.id);

  if (!admin || admin.role !== "admin")
    return next(new ApiError("Admin not found", 404));

  if (!["active", "rejected"].includes(status))
    return next(new ApiError("Invalid status value", 400));

  admin.status = status;
  await admin.save();

  res.status(200).json({
    status: "success",
    message: `Admin ${status === "active" ? "approved" : "rejected"} successfully.`,
  });
});


exports.createAdminByAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, password } = req.body;
  if (!email || !password)
    return next(new ApiError("Email and password are required", 400));

  const existing = await User.findOne({ email });
  if (existing) return next(new ApiError("Email already exists", 400));

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await User.create({
    fullName,
    email,
    role: "admin",
    status: "pending",
    profileImg: null,
    password: hashedPassword,
  });

  res.status(201).json({
    status: "success",
    message: "Admin added and activated successfully.",
    data: admin,
  });
});

exports.deleteUserByAdmin = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  
  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  // لو سواق، احذفي بروفايله وصوره
  if (user.role === "driver" && user.driverProfile) {
    const driverProfile = await DriverProfile.findById(user.driverProfile);
    
    if (driverProfile) {
      deleteDriverImages(driverProfile);
      await DriverProfile.findByIdAndDelete(user.driverProfile);
    }
  }

  // احذفي صورة البروفايل
  if (user.profileImg) {
    deleteImageFile(user.profileImg);
  }

  // احذفي المستخدم
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    status: "success",
    message: "User account deleted successfully by admin",
  });
});

// @desc    Get all rides with filters
// @route   GET /api/v1/admin/rides
// @access  Private (Admin only)
exports.getAllRides = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;

  const [rides, total] = await Promise.all([
    Ride.find(filter)
      .populate("driver", "fullName phone rating")
      .populate("passenger", "fullName phone rating")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Ride.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: rides.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: +page,
    data: rides,
  });
});

// @desc    Get ride statistics
// @route   GET /api/v1/admin/rides/stats
// @access  Private (Admin only)
exports.getRideStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalRides,
    completedRides,
    activeRides,
    cancelledRides,
    todayRides,
    totalRevenue,
  ] = await Promise.all([
    Ride.countDocuments(),
    Ride.countDocuments({ status: "completed" }),
    Ride.countDocuments({ status: { $in: ["pending", "accepted", "started", "arrived"] } }),
    Ride.countDocuments({ status: "cancelled" }),
    Ride.countDocuments({ createdAt: { $gte: today } }),
    Ride.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$fare" } } },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalRides,
      completedRides,
      activeRides,
      cancelledRides,
      todayRides,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
  });
});

// @desc    Get ride by ID
// @route   GET /api/v1/admin/rides/:id
// @access  Private (Admin only)
exports.getRideById = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findById(req.params.id)
    .populate("driver", "fullName phone profileImg rating")
    .populate("passenger", "fullName phone profileImg rating");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: ride,
  });
});

// @desc    Create voucher
// @route   POST /api/v1/admin/vouchers
// @access  Private (Admin only)
exports.createVoucher = asyncHandler(async (req, res, next) => {
  const Voucher = require("../models/voucherModel");
  
  const voucher = await Voucher.create(req.body);

  res.status(201).json({
    status: "success",
    message: "Voucher created successfully",
    data: voucher,
  });
});

// @desc    Get all vouchers
// @route   GET /api/v1/admin/vouchers
// @access  Private (Admin only)
exports.getAllVouchers = asyncHandler(async (req, res, next) => {
  const Voucher = require("../models/voucherModel");
  
  const vouchers = await Voucher.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: vouchers.length,
    data: vouchers,
  });
});

// @desc    Update voucher
// @route   PUT /api/v1/admin/vouchers/:id
// @access  Private (Admin only)
exports.updateVoucher = asyncHandler(async (req, res, next) => {
  const Voucher = require("../models/voucherModel");
  
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!voucher) {
    return next(new ApiError("Voucher not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Voucher updated successfully",
    data: voucher,
  });
});

// @desc    Delete voucher
// @route   DELETE /api/v1/admin/vouchers/:id
// @access  Private (Admin only)
exports.deleteVoucher = asyncHandler(async (req, res, next) => {
  const Voucher = require("../models/voucherModel");
  
  const voucher = await Voucher.findByIdAndDelete(req.params.id);

  if (!voucher) {
    return next(new ApiError("Voucher not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Voucher deleted successfully",
  });
});

// @desc    Get all wallet transactions
// @route   GET /api/v1/admin/wallets
// @access  Private (Admin only)
exports.getAllWalletTransactions = asyncHandler(async (req, res, next) => {
  const Wallet = require("../models/walletModel");
  
  const wallets = await Wallet.find().populate("user", "fullName phone email");

  res.status(200).json({
    status: "success",
    results: wallets.length,
    data: wallets,
  });
});

// ============================================
// Complaints Management
// ============================================

// @desc    Get all complaints with filters
// @route   GET /api/v1/admin/complaints
// @access  Private (Admin only)
exports.getAllComplaints = asyncHandler(async (req, res) => {
  const { status, userType, page = 1, limit = 20, startDate, endDate } = req.query;
  
  const filter = {};
  if (status) filter.status = status;
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const Complaint = require("../models/complaintModel");
  
  let query = Complaint.find(filter)
    .populate("user", "fullName phone email role profileImg")
    .populate("ride", "pickupLocation dropoffLocation fare status")
    .populate("resolvedBy", "fullName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const [complaints, total] = await Promise.all([
    query,
    Complaint.countDocuments(filter)
  ]);
  
  res.status(200).json({
    status: "success",
    results: complaints.length,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    data: complaints,
  });
});

// @desc    Get complaint statistics
// @route   GET /api/v1/admin/complaints/stats
// @access  Private (Admin only)
exports.getComplaintStats = asyncHandler(async (req, res) => {
  const Complaint = require("../models/complaintModel");
  
  const [total, byStatus] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ])
  ]);
  
  const stats = {
    total,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0
  };
  
  byStatus.forEach(item => {
    stats[item._id] = item.count;
  });
  
  res.status(200).json({
    status: "success",
    data: stats,
  });
});

// @desc    Get complaint by ID
// @route   GET /api/v1/admin/complaints/:id
// @access  Private (Admin only)
exports.getComplaintById = asyncHandler(async (req, res, next) => {
  const Complaint = require("../models/complaintModel");
  
  const complaint = await Complaint.findById(req.params.id)
    .populate("user", "fullName phone email role profileImg")
    .populate("ride", "pickupLocation dropoffLocation fare status driver passenger")
    .populate("resolvedBy", "fullName email");
  
  if (!complaint) {
    return next(new ApiError("Complaint not found", 404));
  }
  
  res.status(200).json({
    status: "success",
    data: complaint,
  });
});

// @desc    Reply to complaint
// @route   POST /api/v1/admin/complaints/:id/reply
// @access  Private (Admin only)
exports.replyToComplaint = asyncHandler(async (req, res, next) => {
  const { reply } = req.body;
  
  if (!reply) {
    return next(new ApiError("Reply is required", 400));
  }
  
  const Complaint = require("../models/complaintModel");
  
  const complaint = await Complaint.findById(req.params.id);
  
  if (!complaint) {
    return next(new ApiError("Complaint not found", 404));
  }
  
  complaint.adminReply = reply;
  complaint.status = "in_progress";
  await complaint.save();
  
  res.status(200).json({
    status: "success",
    message: "Reply sent successfully",
    data: complaint,
  });
});

// @desc    Update complaint status
// @route   PUT /api/v1/admin/complaints/:id/status
// @access  Private (Admin only)
exports.updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !["pending", "in_progress", "resolved", "rejected"].includes(status)) {
    return next(new ApiError("Invalid status", 400));
  }
  
  const Complaint = require("../models/complaintModel");
  
  const complaint = await Complaint.findById(req.params.id);
  
  if (!complaint) {
    return next(new ApiError("Complaint not found", 404));
  }
  
  complaint.status = status;
  
  if (status === "resolved" || status === "rejected") {
    complaint.resolvedBy = req.user._id;
    complaint.resolvedAt = new Date();
  }
  
  await complaint.save();
  
  res.status(200).json({
    status: "success",
    message: "Complaint status updated",
    data: complaint,
  });
});

module.exports = exports;
