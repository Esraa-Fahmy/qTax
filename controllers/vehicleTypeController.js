const asyncHandler = require("express-async-handler");
const VehicleType = require("../models/vehicleTypeModel");
const Settings = require("../models/settingsModel");
const ApiError = require("../utils/apiError");

// ============================================
// ADMIN ENDPOINTS
// ============================================

// @desc    Create new vehicle type
// @route   POST /api/v1/admin/vehicle-types
// @access  Private (Admin only)
exports.createVehicleType = asyncHandler(async (req, res, next) => {
  // Handle image upload
  if (req.file) {
    req.body.image = req.file.filename;
  }

  const vehicleType = await VehicleType.create(req.body);

  res.status(201).json({
    status: "success",
    message: "Vehicle type created successfully",
    data: vehicleType,
  });
});

// @desc    Get all vehicle types (Admin view)
// @route   GET /api/v1/admin/vehicle-types
// @access  Private (Admin only)
exports.getAllVehicleTypesAdmin = asyncHandler(async (req, res, next) => {
  const vehicleTypes = await VehicleType.find().sort({ name: 1 });

  res.status(200).json({
    status: "success",
    results: vehicleTypes.length,
    data: vehicleTypes,
  });
});

// @desc    Update vehicle type
// @route   PUT /api/v1/admin/vehicle-types/:id
// @access  Private (Admin only)
exports.updateVehicleType = asyncHandler(async (req, res, next) => {
  // Handle image upload
  if (req.file) {
    req.body.image = req.file.filename;
  }

  const vehicleType = await VehicleType.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!vehicleType) {
    return next(new ApiError("Vehicle type not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Vehicle type updated successfully",
    data: vehicleType,
  });
});

// @desc    Delete vehicle type
// @route   DELETE /api/v1/admin/vehicle-types/:id
// @access  Private (Admin only)
exports.deleteVehicleType = asyncHandler(async (req, res, next) => {
  const vehicleType = await VehicleType.findByIdAndDelete(req.params.id);

  if (!vehicleType) {
    return next(new ApiError("Vehicle type not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Vehicle type deleted successfully",
  });
});

// @desc    Toggle vehicle type status
// @route   PUT /api/v1/admin/vehicle-types/:id/toggle-status
// @access  Private (Admin only)
exports.toggleVehicleTypeStatus = asyncHandler(async (req, res, next) => {
  const vehicleType = await VehicleType.findById(req.params.id);

  if (!vehicleType) {
    return next(new ApiError("Vehicle type not found", 404));
  }

  vehicleType.isActive = !vehicleType.isActive;
  await vehicleType.save();

  res.status(200).json({
    status: "success",
    message: `Vehicle type ${vehicleType.isActive ? "activated" : "deactivated"} successfully`,
    data: vehicleType,
  });
});

// ============================================
// PASSENGER ENDPOINTS
// ============================================

// @desc    Get available vehicle types with pricing
// @route   GET /api/v1/passenger/vehicle-types
// @access  Private (Passenger only)
exports.getAvailableVehicleTypes = asyncHandler(async (req, res, next) => {
  const { distance, duration } = req.query;

  if (!distance || !duration) {
    return next(new ApiError("Distance and duration are required", 400));
  }

  // Get active vehicle types
  const vehicleTypes = await VehicleType.find({ isActive: true }).sort({ baseMultiplier: 1 });

  if (vehicleTypes.length === 0) {
    return next(new ApiError("No vehicle types available", 404));
  }

  // Get pricing settings
  const settings = await Settings.findOne();
  if (!settings) {
    return next(new ApiError("Pricing settings not configured", 500));
  }

  // Calculate fare for each vehicle type
  const vehicleTypesWithPricing = vehicleTypes.map((vehicleType) => {
    // Base fare calculation
    const baseFare = settings.baseFare;
    const distanceCost = parseFloat(distance) * settings.pricePerKm;
    const durationCost = parseFloat(duration) * settings.pricePerMinute;
    
    // Apply vehicle multiplier
    const totalFare = (baseFare + distanceCost + durationCost) * vehicleType.baseMultiplier;
    
    // Apply surge if active
    const finalFare = settings.isSurgeActive 
      ? totalFare * settings.surgeMultiplier 
      : totalFare;

    // Ensure minimum fare
    const fare = Math.max(finalFare, settings.minFare * vehicleType.baseMultiplier);

    return {
      _id: vehicleType._id,
      name: vehicleType.name,
      nameAr: vehicleType.nameAr,
      description: vehicleType.description,
      descriptionAr: vehicleType.descriptionAr,
      passengerCapacity: vehicleType.passengerCapacity,
      image: vehicleType.image,
      icon: vehicleType.icon,
      features: vehicleType.features,
      estimatedFare: Math.round(fare), // Round to nearest whole number
      distance: parseFloat(distance),
      duration: parseFloat(duration),
      isSurgeActive: settings.isSurgeActive,
    };
  });

  res.status(200).json({
    status: "success",
    results: vehicleTypesWithPricing.length,
    data: vehicleTypesWithPricing,
  });
});
