const asyncHandler = require("express-async-handler");
const City = require("../models/cityModel");
const ApiError = require("../utils/apiError");

// @desc    Get all cities
// @route   GET /api/v1/admin/cities
// @access  Private (Admin only)
exports.getAllCities = asyncHandler(async (req, res) => {
  const { isActive, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  
  const skip = (page - 1) * limit;
  
  const [cities, total] = await Promise.all([
    City.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    City.countDocuments(filter)
  ]);
  
  res.status(200).json({
    status: "success",
    results: cities.length,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    data: cities,
  });
});

// @desc    Get city by ID
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

// @desc    Create city
// @route   POST /api/v1/admin/cities
// @access  Private (Admin only)
exports.createCity = asyncHandler(async (req, res, next) => {
  const city = await City.create(req.body);
  
  res.status(201).json({
    status: "success",
    message: "City created successfully",
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
    message: "City updated successfully",
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

// @desc    Toggle city active status
// @route   PUT /api/v1/admin/cities/:id/toggle-status
// @access  Private (Admin only)
exports.toggleCityStatus = asyncHandler(async (req, res, next) => {
  const city = await City.findById(req.params.id);
  
  if (!city) {
    return next(new ApiError("City not found", 404));
  }
  
  city.isActive = !city.isActive;
  await city.save();
  
  res.status(200).json({
    status: "success",
    message: `City ${city.isActive ? 'activated' : 'deactivated'} successfully`,
    data: city,
  });
});
