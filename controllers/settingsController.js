const asyncHandler = require("express-async-handler");
const Settings = require("../models/settingsModel");
const ApiError = require("../utils/apiError");

// @desc    Get settings
// @route   GET /api/v1/admin/settings
// @access  Private (Admin only)
exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  // Create default settings if none exist
  if (!settings) {
    settings = await Settings.create({});
  }
  
  res.status(200).json({
    status: "success",
    data: settings,
  });
});

// @desc    Create settings
// @route   POST /api/v1/admin/settings
// @access  Private (Admin only)
exports.createSettings = asyncHandler(async (req, res, next) => {
  const existing = await Settings.findOne();
  
  if (existing) {
    return next(new ApiError("Settings already exist. Use PUT to update.", 400));
  }
  
  const settings = await Settings.create(req.body);
  
  res.status(201).json({
    status: "success",
    message: "Settings created successfully",
    data: settings,
  });
});

// @desc    Update settings
// @route   PUT /api/v1/admin/settings
// @access  Private (Admin only)
exports.updateSettings = asyncHandler(async (req, res, next) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
      new: true,
      runValidators: true,
    });
  }
  
  res.status(200).json({
    status: "success",
    message: "Settings updated successfully",
    data: settings,
  });
});

// @desc    Delete settings
// @route   DELETE /api/v1/admin/settings
// @access  Private (Admin only)
exports.deleteSettings = asyncHandler(async (req, res, next) => {
  const settings = await Settings.findOne();
  
  if (!settings) {
    return next(new ApiError("Settings not found", 404));
  }
  
  await Settings.findByIdAndDelete(settings._id);
  
  res.status(200).json({
    status: "success",
    message: "Settings deleted successfully",
  });
});

// @desc    Get pricing settings
// @route   GET /api/v1/admin/pricing
// @access  Private (Admin only)
exports.getPricingSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({});
  }
  
  const pricing = {
    baseFare: settings.baseFare,
    pricePerKm: settings.pricePerKm,
    pricePerMinute: settings.pricePerMinute,
    minFare: settings.minFare,
    appCommission: settings.appCommission,
  };
  
  res.status(200).json({
    status: "success",
    data: pricing,
  });
});

// @desc    Update pricing settings
// @route   PUT /api/v1/admin/pricing
// @access  Private (Admin only)
exports.updatePricingSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({});
  }
  
  const { baseFare, pricePerKm, pricePerMinute, minFare, appCommission } = req.body;
  
  if (baseFare !== undefined) settings.baseFare = baseFare;
  if (pricePerKm !== undefined) settings.pricePerKm = pricePerKm;
  if (pricePerMinute !== undefined) settings.pricePerMinute = pricePerMinute;
  if (minFare !== undefined) settings.minFare = minFare;
  if (appCommission !== undefined) settings.appCommission = appCommission;
  
  await settings.save();
  
  res.status(200).json({
    status: "success",
    message: "Pricing settings updated successfully",
    data: settings,
  });
});

// @desc    Get vehicle pricing multipliers
// @route   GET /api/v1/admin/pricing/vehicles
// @access  Private (Admin only)
exports.getVehicleMultipliers = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({});
  }
  
  res.status(200).json({
    status: "success",
    data: settings.vehicleMultipliers,
  });
});

// @desc    Update vehicle multiplier
// @route   PUT /api/v1/admin/pricing/vehicles/:type
// @access  Private (Admin only)
exports.updateVehicleMultiplier = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const { multiplier } = req.body;
  
  if (!['economy', 'comfort', 'premium'].includes(type)) {
    return next(new ApiError("Invalid vehicle type", 400));
  }
  
  if (!multiplier || multiplier <= 0) {
    return next(new ApiError("Multiplier must be greater than 0", 400));
  }
  
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({});
  }
  
  settings.vehicleMultipliers[type] = multiplier;
  await settings.save();
  
  res.status(200).json({
    status: "success",
    message: `${type} multiplier updated successfully`,
    data: settings.vehicleMultipliers,
  });
});
