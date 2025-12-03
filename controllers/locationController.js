const asyncHandler = require("express-async-handler");
const City = require("../models/cityModel");
const ApiError = require("../utils/apiError");
const { calculateDistance } = require("../utils/distanceCalculator");

// @desc    Check if location is available
// @route   POST /api/v1/passenger/location/check
// @access  Private (Passenger only)
exports.checkLocationAvailability = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return next(new ApiError("Latitude and longitude are required", 400));
  }

  // Get all active cities
  const activeCities = await City.find({ isActive: true });

  if (activeCities.length === 0) {
    return res.status(200).json({
      status: "success",
      isAvailable: false,
      message: "Qtax is not available here",
      messageAr: "تطبيق Qtax غير متاح في هذا الموقع",
    });
  }

  // Check if location is within any city's coverage
  let isAvailable = false;
  let nearestCity = null;
  let minDistance = Infinity;

  for (const city of activeCities) {
    if (city.location && city.location.coordinates && city.location.coordinates.length === 2) {
      const [cityLng, cityLat] = city.location.coordinates;
      
      // Calculate distance from location to city center
      const distance = calculateDistance(
        latitude,
        longitude,
        cityLat,
        cityLng
      );

      // Check if within city radius
      if (distance <= city.radius) {
        isAvailable = true;
        nearestCity = city;
        break;
      }

      // Track nearest city
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }
  }

  if (isAvailable) {
    return res.status(200).json({
      status: "success",
      isAvailable: true,
      message: "Qtax is available in your location",
      messageAr: "تطبيق Qtax متاح في موقعك",
      city: {
        name: nearestCity.name,
        nameAr: nearestCity.nameAr,
      },
    });
  } else {
    return res.status(200).json({
      status: "success",
      isAvailable: false,
      message: "Qtax is not available here",
      messageAr: "تطبيق Qtax غير متاح في هذا الموقع",
      nearestCity: nearestCity ? {
        name: nearestCity.name,
        nameAr: nearestCity.nameAr,
        distanceKm: Math.round(minDistance * 10) / 10,
      } : null,
    });
  }
});
