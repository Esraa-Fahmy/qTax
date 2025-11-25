const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Ride = require("../models/rideModel");
const ApiError = require("../utils/apiError");

// @desc    Toggle driver online/offline status
// @route   PUT /api/v1/driver/status/toggle
// @access  Private (Driver only)
exports.toggleOnlineStatus = asyncHandler(async (req, res, next) => {
  const { isOnline } = req.body;

  if (typeof isOnline !== "boolean") {
    return next(new ApiError("isOnline must be a boolean value", 400));
  }

  const driver = await User.findById(req.user._id);

  // Check if driver has active ride
  if (!isOnline) {
    const activeRide = await Ride.findOne({
      driver: req.user._id,
      status: { $in: ["accepted", "started", "arrived"] },
    });

    if (activeRide) {
      return next(
        new ApiError("Cannot go offline while you have an active ride", 400)
      );
    }
  }

  driver.isOnline = isOnline;
  await driver.save();

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.emit("driver:status", {
      driverId: driver._id,
      isOnline: driver.isOnline,
    });
  }

  res.status(200).json({
    status: "success",
    message: `You are now ${isOnline ? "online" : "offline"}`,
    data: {
      isOnline: driver.isOnline,
    },
  });
});

// @desc    Update driver location
// @route   PUT /api/v1/driver/location
// @access  Private (Driver only)
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return next(new ApiError("Latitude and longitude are required", 400));
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return next(new ApiError("Invalid coordinates", 400));
  }

  const driver = await User.findById(req.user._id);

  driver.currentLocation = {
    latitude,
    longitude,
    updatedAt: new Date(),
  };

  await driver.save();

  // Emit location update to passengers tracking this driver
  const io = req.app.get("io");
  if (io) {
    // Find active ride for this driver
    const activeRide = await Ride.findOne({
      driver: req.user._id,
      status: { $in: ["accepted", "started"] },
    });

    if (activeRide) {
      io.to(`user_${activeRide.passenger}`).emit("driver:location", {
        latitude,
        longitude,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Location updated",
  });
});

// @desc    Get driver earnings
// @route   GET /api/v1/driver/earnings
// @access  Private (Driver only)
exports.getEarnings = asyncHandler(async (req, res, next) => {
  const driver = await User.findById(req.user._id).select("earnings totalRides rating");

  // Get today's completed rides count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRides = await Ride.countDocuments({
    driver: req.user._id,
    status: "completed",
    completedAt: { $gte: today },
  });

  // Get this week's completed rides count
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekRides = await Ride.countDocuments({
    driver: req.user._id,
    status: "completed",
    completedAt: { $gte: weekStart },
  });

  res.status(200).json({
    status: "success",
    data: {
      earnings: driver.earnings,
      totalRides: driver.totalRides,
      todayRides,
      weekRides,
      rating: driver.rating,
    },
  });
});

// @desc    Update driver settings
// @route   PUT /api/v1/driver/settings
// @access  Private (Driver only)
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const { autoAcceptRequests, pickupRadius, fcmToken } = req.body;

  const driver = await User.findById(req.user._id);

  if (typeof autoAcceptRequests === "boolean") {
    driver.autoAcceptRequests = autoAcceptRequests;
  }

  if (pickupRadius && pickupRadius > 0 && pickupRadius <= 50) {
    driver.pickupRadius = pickupRadius;
  }

  if (fcmToken) {
    driver.fcmToken = fcmToken;
  }

  await driver.save();

  res.status(200).json({
    status: "success",
    message: "Settings updated successfully",
    data: {
      autoAcceptRequests: driver.autoAcceptRequests,
      pickupRadius: driver.pickupRadius,
    },
  });
});

// @desc    Get heat map data (high demand areas)
// @route   GET /api/v1/driver/heatmap
// @access  Private (Driver only)
exports.getHeatMap = asyncHandler(async (req, res, next) => {
  // Get pending rides grouped by area
  const rides = await Ride.find({
    status: "pending",
    driver: null,
  }).select("pickupLocation");

  // Simple heat map: return pickup locations
  // In production, you'd cluster these into zones
  const heatMapData = rides.map((ride) => ({
    latitude: ride.pickupLocation.coordinates.latitude,
    longitude: ride.pickupLocation.coordinates.longitude,
    intensity: 1, // Could be calculated based on number of rides in area
  }));

  res.status(200).json({
    status: "success",
    results: heatMapData.length,
    data: heatMapData,
  });
});

// @desc    Get driver dashboard stats
// @route   GET /api/v1/driver/dashboard
// @access  Private (Driver only)
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const driver = await User.findById(req.user._id).select(
    "isOnline earnings totalRides rating currentLocation autoAcceptRequests pickupRadius"
  );

  // Get active ride if any
  const activeRide = await Ride.findOne({
    driver: req.user._id,
    status: { $in: ["accepted", "started", "arrived"] },
  }).populate("passenger", "fullName phone profileImg rating");

  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRides = await Ride.countDocuments({
    driver: req.user._id,
    status: "completed",
    completedAt: { $gte: today },
  });

  res.status(200).json({
    status: "success",
    data: {
      driver: {
        isOnline: driver.isOnline,
        earnings: driver.earnings,
        totalRides: driver.totalRides,
        todayRides,
        rating: driver.rating,
        currentLocation: driver.currentLocation,
        settings: {
          autoAcceptRequests: driver.autoAcceptRequests,
          pickupRadius: driver.pickupRadius,
        },
      },
      activeRide,
    },
  });
});
