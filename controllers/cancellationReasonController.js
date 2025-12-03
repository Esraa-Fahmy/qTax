const asyncHandler = require("express-async-handler");
const CancellationReason = require("../models/cancellationReasonModel");
const ApiError = require("../utils/apiError");

// ============================================
// ADMIN ENDPOINTS
// ============================================

// @desc    Create new cancellation reason
// @route   POST /api/v1/admin/cancellation-reasons
// @access  Private (Admin only)
exports.createCancellationReason = asyncHandler(async (req, res, next) => {
  const cancellationReason = await CancellationReason.create(req.body);

  res.status(201).json({
    status: "success",
    message: "Cancellation reason created successfully",
    data: cancellationReason,
  });
});

// @desc    Get all cancellation reasons (Admin view)
// @route   GET /api/v1/admin/cancellation-reasons
// @access  Private (Admin only)
exports.getAllCancellationReasonsAdmin = asyncHandler(async (req, res, next) => {
  const { userType } = req.query;

  const filter = {};
  if (userType) {
    filter.userType = userType;
  }

  const reasons = await CancellationReason.find(filter).sort({ userType: 1, order: 1 });

  res.status(200).json({
    status: "success",
    results: reasons.length,
    data: reasons,
  });
});

// @desc    Update cancellation reason
// @route   PUT /api/v1/admin/cancellation-reasons/:id
// @access  Private (Admin only)
exports.updateCancellationReason = asyncHandler(async (req, res, next) => {
  const reason = await CancellationReason.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!reason) {
    return next(new ApiError("Cancellation reason not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Cancellation reason updated successfully",
    data: reason,
  });
});

// @desc    Delete cancellation reason
// @route   DELETE /api/v1/admin/cancellation-reasons/:id
// @access  Private (Admin only)
exports.deleteCancellationReason = asyncHandler(async (req, res, next) => {
  const reason = await CancellationReason.findByIdAndDelete(req.params.id);

  if (!reason) {
    return next(new ApiError("Cancellation reason not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Cancellation reason deleted successfully",
  });
});

// @desc    Reorder cancellation reasons
// @route   PUT /api/v1/admin/cancellation-reasons/reorder
// @access  Private (Admin only)
exports.reorderCancellationReasons = asyncHandler(async (req, res, next) => {
  const { reasons } = req.body; // Array of { id, order }

  if (!reasons || !Array.isArray(reasons)) {
    return next(new ApiError("Invalid request format", 400));
  }

  // Update order for each reason
  const updatePromises = reasons.map((item) =>
    CancellationReason.findByIdAndUpdate(
      item.id,
      { order: item.order },
      { new: true }
    )
  );

  await Promise.all(updatePromises);

  res.status(200).json({
    status: "success",
    message: "Cancellation reasons reordered successfully",
  });
});

// ============================================
// PASSENGER & DRIVER ENDPOINTS
// ============================================

// @desc    Get cancellation reasons by user type
// @route   GET /api/v1/passenger/cancellation-reasons
// @route   GET /api/v1/driver/cancellation-reasons
// @access  Private (Passenger or Driver)
exports.getCancellationReasons = asyncHandler(async (req, res, next) => {
  // Determine user type from route or user role
  let userType = req.user.role === "driver" ? "driver" : "passenger";

  const reasons = await CancellationReason.find({
    userType,
    isActive: true,
  }).sort({ order: 1 });

  res.status(200).json({
    status: "success",
    results: reasons.length,
    data: reasons,
  });
});
