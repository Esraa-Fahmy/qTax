const asyncHandler = require("express-async-handler");
const Ride = require("../models/rideModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const ApiError = require("../utils/apiError");

// @desc    Driver arrived at pickup location
// @route   POST /api/v1/driver/rides/:rideId/arrive
// @access  Private (Driver only)
exports.arriveAtPickup = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findById(req.params.rideId)
    .populate("passenger", "fullName phone");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (ride.status !== "accepted") {
    return next(new ApiError("Invalid ride status", 400));
  }

  ride.status = "arrived";
  ride.arrivedAt = new Date();
  await ride.save();

  // Send notification to passenger
  await Notification.create({
    user: ride.passenger._id,
    title: "Driver Arrived",
    titleAr: "وصل السائق",
    message: "Your driver has arrived at the pickup location",
    messageAr: "وصل السائق إلى موقع الاستلام",
    subtitle: `Ride #${ride._id.toString().slice(-6)}`,
    subtitleAr: `رحلة #${ride._id.toString().slice(-6)}`,
    type: "ride",
    data: { rideId: ride._id },
  });

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:arrived", ride);
  }

  res.status(200).json({
    status: "success",
    message: "Arrival confirmed",
    data: ride,
  });
});

// @desc    Start the ride
// @route   POST /api/v1/driver/rides/:rideId/start
// @access  Private (Driver only)
exports.startRide = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findById(req.params.rideId)
    .populate("passenger", "fullName phone");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (ride.status !== "arrived" && ride.status !== "accepted") {
    return next(new ApiError("Invalid ride status", 400));
  }

  ride.status = "started";
  ride.startedAt = new Date();
  
  // For meter mode rides
  if (ride.isMeterMode) {
    ride.meterStartTime = new Date();
  }
  
  await ride.save();

  // Send notification to passenger
  await Notification.create({
    user: ride.passenger._id,
    title: "Ride Started",
    titleAr: "بدأت الرحلة",
    message: "Your ride has started. Have a safe trip!",
    messageAr: "بدأت رحلتك. رحلة آمنة!",
    subtitle: `Ride #${ride._id.toString().slice(-6)}`,
    subtitleAr: `رحلة #${ride._id.toString().slice(-6)}`,
    type: "ride",
    data: { rideId: ride._id },
  });

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:started", ride);
  }

  res.status(200).json({
    status: "success",
    message: "Ride started",
    data: ride,
  });
});

// @desc    Update driver location (for real-time tracking)
// @route   POST /api/v1/driver/location/update
// @access  Private (Driver only)
exports.updateDriverLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return next(new ApiError("Latitude and longitude are required", 400));
  }

  // Update driver's current location
  const driver = await User.findById(req.user._id);
  driver.currentLocation = {
    latitude,
    longitude,
    updatedAt: new Date(),
  };
  await driver.save();

  // Find active ride for this driver
  const activeRide = await Ride.findOne({
    driver: req.user._id,
    status: { $in: ["accepted", "started", "arrived"] },
  });

  // If driver has active ride, send location update to passenger
  if (activeRide) {
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${activeRide.passenger}`).emit("driver:location-update", {
        rideId: activeRide._id,
        location: {
          latitude,
          longitude,
          timestamp: new Date(),
        },
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Location updated",
    data: {
      latitude,
      longitude,
    },
  });
});

module.exports = {
  arriveAtPickup: exports.arriveAtPickup,
  startRide: exports.startRide,
  updateDriverLocation: exports.updateDriverLocation,
};
