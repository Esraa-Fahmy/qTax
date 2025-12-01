const asyncHandler = require("express-async-handler");
const City = require("../models/cityModel");
const ApiError = require("../utils/apiError");

// @desc    Create a new city
// @route   POST /api/v1/admin/cities
// @access  Private (Admin only)
exports.createCity = asyncHandler(async (req, res, next) => {
  const city = await City.create(req.body);

  res.status(201).json({
    status: "success",
    data: city,
  });
});

// @desc    Get all cities
// @route   GET /api/v1/admin/cities
// @access  Private (Admin only)
exports.getAllCities = asyncHandler(async (req, res, next) => {
  const cities = await City.find();

  res.status(200).json({
    status: "success",
    results: cities.length,
    data: cities,
  });
});

// @desc    Get specific city
// @route   GET /api/v1/admin/cities/:id
// @access  Private (Admin only)
exports.getCity = asyncHandler(async (req, res, next) => {
  const city = await City.findById(req.params.id);

  if (!city) {
    return next(new ApiError("City not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: city,
  });
});

// @desc    Update city
// @route   PUT /api/v1/admin/cities/:id
// @access  Private (Admin only)
exports.updateCity = asyncHandler(async (req, res, next) => {
  const city = await City.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!city) {
    return next(new ApiError("City not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: city,
  });
});

// @desc    Delete city
// @route   DELETE /api/v1/admin/cities/:id
// @access  Private (Admin only)
exports.deleteCity = asyncHandler(async (req, res, next) => {
  const city = await City.findByIdAndDelete(req.params.id);

  if (!city) {
    return next(new ApiError("City not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "City deleted successfully",
  });
});
