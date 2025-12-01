const asyncHandler = require("express-async-handler");
const Settings = require("../models/settingsModel");
const ApiError = require("../utils/apiError");

// @desc    Create pricing settings (First time)
// @route   POST /api/v1/admin/settings
// @access  Private (Admin only)
exports.createSettings = asyncHandler(async (req, res, next) => {
  const existingSettings = await Settings.findOne();

  if (existingSettings) {
    return next(new ApiError("Settings already exist. Use PUT to update.", 400));
  }

  const settings = await Settings.create(req.body);

  res.status(201).json({
    status: "success",
    message: "Settings created successfully",
    data: settings,
  });
});

// @desc    Get current pricing settings
// @route   GET /api/v1/admin/settings
// @access  Private (Admin only)
exports.getSettings = asyncHandler(async (req, res, next) => {
  let settings = await Settings.findOne();

  // If no settings exist, create default ones
  if (!settings) {
    settings = await Settings.create({});
  }

  res.status(200).json({
    status: "success",
    data: settings,
  });
});

// @desc    Update pricing settings
// @route   PUT /api/v1/admin/settings
// @access  Private (Admin only)
exports.updateSettings = asyncHandler(async (req, res, next) => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  // Update fields
  const allowedFields = [
    "baseFare",
    "pricePerKm",
    "pricePerMinute",
    "minFare",
    "vehicleMultipliers",
    "surgeMultiplier",
    "isSurgeActive",
    "appCommission",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  await settings.save();

  res.status(200).json({
    status: "success",
    message: "Settings updated successfully",
    data: settings,
  });
});

// @desc    Delete pricing settings (Reset)
// @route   DELETE /api/v1/admin/settings
// @access  Private (Admin only)
exports.deleteSettings = asyncHandler(async (req, res, next) => {
  await Settings.deleteMany(); // Delete all settings documents

  res.status(200).json({
    status: "success",
    message: "Settings deleted successfully",
  });
});
