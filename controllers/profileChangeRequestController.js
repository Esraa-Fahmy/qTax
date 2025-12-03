const asyncHandler = require("express-async-handler");
const ProfileChangeRequest = require("../models/profileChangeRequestModel");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");

// @desc    Request profile change
// @route   POST /api/v1/driver/profile/request-change
// @access  Private (Driver only)
exports.requestProfileChange = asyncHandler(async (req, res, next) => {
  const { requestType, requestedValue, reason } = req.body;

  if (!requestType || !requestedValue || !reason) {
    return next(new ApiError("All fields are required", 400));
  }

  // Check for pending request of same type
  const existingRequest = await ProfileChangeRequest.findOne({
    user: req.user._id,
    requestType,
    status: "pending",
  });

  if (existingRequest) {
    return next(new ApiError("You already have a pending request for this type", 400));
  }

  let currentValue = "";
  if (requestType === "name") currentValue = req.user.fullName;
  if (requestType === "phone") currentValue = req.user.phone;
  if (requestType === "email") currentValue = req.user.email;

  const request = await ProfileChangeRequest.create({
    user: req.user._id,
    requestType,
    currentValue,
    requestedValue,
    reason,
  });

  res.status(201).json({
    status: "success",
    message: "Request submitted successfully",
    data: request,
  });
});

// @desc    Get all requests (Admin)
// @route   GET /api/v1/admin/profile-change-requests
// @access  Private (Admin only)
exports.getAllRequests = asyncHandler(async (req, res, next) => {
  const requests = await ProfileChangeRequest.find()
    .populate("user", "fullName phone email")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: requests.length,
    data: requests,
  });
});

// @desc    Approve request (Admin)
// @route   PUT /api/v1/admin/profile-change-requests/:id/approve
// @access  Private (Admin only)
exports.approveRequest = asyncHandler(async (req, res, next) => {
  const request = await ProfileChangeRequest.findById(req.params.id);

  if (!request) {
    return next(new ApiError("Request not found", 404));
  }

  if (request.status !== "pending") {
    return next(new ApiError("Request is already processed", 400));
  }

  const user = await User.findById(request.user);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  // Apply changes
  if (request.requestType === "name") user.fullName = request.requestedValue;
  if (request.requestType === "phone") user.phone = request.requestedValue;
  if (request.requestType === "email") user.email = request.requestedValue;
  
  await user.save();

  request.status = "approved";
  request.reviewedBy = req.user._id;
  request.reviewedAt = Date.now();
  await request.save();

  // Notify driver
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${user._id}`).emit("notification:new", {
        title: "تمت الموافقة على طلبك",
        message: `تم تغيير ${request.requestType} بنجاح`,
        type: "system"
    });
  }

  res.status(200).json({
    status: "success",
    message: "Request approved and profile updated",
    data: request,
  });
});

// @desc    Reject request (Admin)
// @route   PUT /api/v1/admin/profile-change-requests/:id/reject
// @access  Private (Admin only)
exports.rejectRequest = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const request = await ProfileChangeRequest.findById(req.params.id);

  if (!request) {
    return next(new ApiError("Request not found", 404));
  }

  if (request.status !== "pending") {
    return next(new ApiError("Request is already processed", 400));
  }

  request.status = "rejected";
  request.adminResponse = reason;
  request.reviewedBy = req.user._id;
  request.reviewedAt = Date.now();
  await request.save();

  // Notify driver
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${request.user}`).emit("notification:new", {
        title: "تم رفض طلبك",
        message: `تم رفض طلب تغيير ${request.requestType}: ${reason}`,
        type: "system"
    });
  }

  res.status(200).json({
    status: "success",
    message: "Request rejected",
    data: request,
  });
});
