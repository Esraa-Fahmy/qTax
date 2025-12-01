const asyncHandler = require("express-async-handler");
const Complaint = require("../models/complaintModel");
const ApiError = require("../utils/apiError");

// @desc    Create a new complaint
// @route   POST /api/v1/complaints
// @access  Private (User/Driver)
exports.createComplaint = asyncHandler(async (req, res, next) => {
  const { subject, message, rideId } = req.body;

  const complaint = await Complaint.create({
    user: req.user._id,
    subject,
    message,
    ride: rideId,
  });

  res.status(201).json({
    status: "success",
    message: "Complaint submitted successfully",
    data: complaint,
  });
});

// @desc    Get my complaints
// @route   GET /api/v1/complaints/my
// @access  Private (User/Driver)
exports.getMyComplaints = asyncHandler(async (req, res, next) => {
  const complaints = await Complaint.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: "success",
    results: complaints.length,
    data: complaints,
  });
});

// @desc    Get all complaints (Admin)
// @route   GET /api/v1/admin/complaints
// @access  Private (Admin)
exports.getAllComplaints = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const complaints = await Complaint.find()
    .populate("user", "fullName phone role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Complaint.countDocuments();

  res.status(200).json({
    status: "success",
    results: complaints.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: complaints,
  });
});

// @desc    Update complaint (Reply/Status)
// @route   PUT /api/v1/admin/complaints/:id
// @access  Private (Admin)
exports.updateComplaint = asyncHandler(async (req, res, next) => {
  const { status, adminReply } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return next(new ApiError("Complaint not found", 404));
  }

  if (status) complaint.status = status;
  if (adminReply) {
    complaint.adminReply = adminReply;
    complaint.resolvedBy = req.user._id;
    complaint.resolvedAt = new Date();
    if (status === "pending") complaint.status = "resolved"; // Auto resolve if reply sent
  }

  await complaint.save();

  res.status(200).json({
    status: "success",
    message: "Complaint updated successfully",
    data: complaint,
  });
});
