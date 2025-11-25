const asyncHandler = require("express-async-handler");
const Voucher = require("../models/voucherModel");
const ApiError = require("../utils/apiError");

// @desc    Apply voucher to ride
// @route   POST /api/v1/passenger/vouchers/apply
// @access  Private (Passenger)
exports.applyVoucher = asyncHandler(async (req, res, next) => {
  const { code, rideAmount } = req.body;

  if (!code || !rideAmount) {
    return next(new ApiError("Voucher code and ride amount are required", 400));
  }

  const voucher = await Voucher.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!voucher) {
    return next(new ApiError("Invalid voucher code", 404));
  }

  // Check expiry
  if (new Date() > voucher.expiryDate) {
    return next(new ApiError("Voucher has expired", 400));
  }

  // Check minimum ride amount
  if (rideAmount < voucher.minRideAmount) {
    return next(
      new ApiError(
        `Minimum ride amount is ${voucher.minRideAmount} EGP`,
        400
      )
    );
  }

  // Check usage limit
  if (voucher.usedBy.length >= voucher.usageLimit) {
    return next(new ApiError("Voucher usage limit reached", 400));
  }

  // Check usage per user
  const userUsageCount = voucher.usedBy.filter(
    (usage) => usage.user.toString() === req.user._id.toString()
  ).length;

  if (userUsageCount >= voucher.usagePerUser) {
    return next(new ApiError("You have already used this voucher", 400));
  }

  // Calculate discount
  let discount = 0;
  if (voucher.discountType === "fixed") {
    discount = voucher.discountValue;
  } else if (voucher.discountType === "percentage") {
    discount = (rideAmount * voucher.discountValue) / 100;
    // Apply max discount if set
    if (voucher.maxDiscount && discount > voucher.maxDiscount) {
      discount = voucher.maxDiscount;
    }
  }

  // Discount cannot exceed ride amount
  if (discount > rideAmount) {
    discount = rideAmount;
  }

  const finalAmount = rideAmount - discount;

  res.status(200).json({
    status: "success",
    message: "Voucher applied successfully",
    data: {
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discount,
      originalAmount: rideAmount,
      finalAmount,
    },
  });
});

// @desc    Get user's available vouchers
// @route   GET /api/v1/passenger/vouchers
// @access  Private (Passenger)
exports.getAvailableVouchers = asyncHandler(async (req, res, next) => {
  const now = new Date();

  const vouchers = await Voucher.find({
    isActive: true,
    expiryDate: { $gt: now },
  }).select("-usedBy");

  // Filter vouchers user can still use
  const availableVouchers = [];

  for (const voucher of vouchers) {
    const fullVoucher = await Voucher.findById(voucher._id);
    
    // Check total usage
    if (fullVoucher.usedBy.length >= fullVoucher.usageLimit) {
      continue;
    }

    // Check user usage
    const userUsageCount = fullVoucher.usedBy.filter(
      (usage) => usage.user.toString() === req.user._id.toString()
    ).length;

    if (userUsageCount < fullVoucher.usagePerUser) {
      availableVouchers.push({
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscount: voucher.maxDiscount,
        minRideAmount: voucher.minRideAmount,
        expiryDate: voucher.expiryDate,
        description: voucher.description,
      });
    }
  }

  res.status(200).json({
    status: "success",
    results: availableVouchers.length,
    data: availableVouchers,
  });
});

// @desc    Mark voucher as used (internal function)
exports.markVoucherAsUsed = async (code, userId, rideId) => {
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });

  if (voucher) {
    voucher.usedBy.push({
      user: userId,
      rideId,
      usedAt: new Date(),
    });
    await voucher.save();
  }
};
