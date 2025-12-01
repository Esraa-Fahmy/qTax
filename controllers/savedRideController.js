const asyncHandler = require("express-async-handler");
const SavedRide = require("../models/savedRideModel");
const ApiError = require("../utils/apiError");

// @desc    Save a ride for later
// @route   POST /api/v1/passenger/saved-rides
// @access  Private (Passenger)
exports.saveRide = asyncHandler(async (req, res, next) => {
  const { name, pickupLocation, dropoffLocation, stops, vehicleType, isFavorite } = req.body;

  const savedRide = await SavedRide.create({
    user: req.user._id,
    name,
    pickupLocation,
    dropoffLocation,
    stops,
    vehicleType,
    isFavorite,
  });

  res.status(201).json({
    status: "success",
    data: savedRide,
  });
});

// @desc    Get all saved rides
// @route   GET /api/v1/passenger/saved-rides
// @access  Private (Passenger)
exports.getSavedRides = asyncHandler(async (req, res, next) => {
  const savedRides = await SavedRide.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: savedRides.length,
    data: savedRides,
  });
});

// @desc    Get specific saved ride
// @route   GET /api/v1/passenger/saved-rides/:id
// @access  Private (Passenger)
exports.getSavedRide = asyncHandler(async (req, res, next) => {
  const savedRide = await SavedRide.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!savedRide) {
    return next(new ApiError("Saved ride not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: savedRide,
  });
});

// @desc    Update saved ride
// @route   PUT /api/v1/passenger/saved-rides/:id
// @access  Private (Passenger)
exports.updateSavedRide = asyncHandler(async (req, res, next) => {
  const savedRide = await SavedRide.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!savedRide) {
    return next(new ApiError("Saved ride not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: savedRide,
  });
});

// @desc    Delete saved ride
// @route   DELETE /api/v1/passenger/saved-rides/:id
// @access  Private (Passenger)
exports.deleteSavedRide = asyncHandler(async (req, res, next) => {
  const savedRide = await SavedRide.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!savedRide) {
    return next(new ApiError("Saved ride not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Saved ride deleted successfully",
  });
});
