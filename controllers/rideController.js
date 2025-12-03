const asyncHandler = require("express-async-handler");
const Ride = require("../models/rideModel");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const { calculateFare, calculateCancellationFee } = require("../utils/fareCalculator");
const { calculateDistance, estimateDuration } = require("../utils/distanceCalculator");

// @desc    Get incoming ride requests for driver
// @route   GET /api/v1/driver/rides/incoming
// @access  Private (Driver only)
exports.getIncomingRides = asyncHandler(async (req, res, next) => {
  const driver = await User.findById(req.user._id);

  if (!driver.isOnline) {
    return next(new ApiError("You must be online to receive ride requests", 400));
  }

  if (!driver.currentLocation || !driver.currentLocation.latitude) {
    return next(new ApiError("Please update your location first", 400));
  }

  // Find pending rides within driver's pickup radius
  const rides = await Ride.find({
    status: "pending",
    driver: null,
  })
    .populate("passenger", "fullName phone profileImg rating")
    .sort({ createdAt: 1 })
    .limit(10);

  // Filter rides within radius
  const { isWithinRadius } = require("../utils/distanceCalculator");
  const nearbyRides = rides.filter((ride) =>
    isWithinRadius(
      driver.currentLocation,
      ride.pickupLocation.coordinates,
      driver.pickupRadius
    )
  );

  res.status(200).json({
    status: "success",
    results: nearbyRides.length,
    data: nearbyRides,
  });
});

// @desc    Accept ride request
// @route   POST /api/v1/driver/rides/:rideId/accept
// @access  Private (Driver only)
exports.acceptRide = asyncHandler(async (req, res, next) => {
  // Check driver profile completion
  const driver = await User.findById(req.user._id).populate("driverProfile");
  
  if (!driver.fullName || !driver.email || !driver.profileImg) {
    return next(new ApiError("Please complete your profile (name, email, photo) before accepting rides", 403));
  }

  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.status !== "pending") {
    return next(new ApiError("This ride is no longer available", 400));
  }

  if (ride.driver) {
    return next(new ApiError("This ride has already been accepted", 400));
  }

  // Check if driver already has an active ride
  const activeDriverRide = await Ride.findOne({
    driver: req.user._id,
    status: { $in: ["accepted", "started", "arrived"] },
  });

  if (activeDriverRide) {
    return next(new ApiError("You already have an active ride. Please complete it first.", 400));
  }

  // Assign driver and update status
  ride.driver = req.user._id;
  ride.status = "accepted";
  ride.acceptedAt = new Date();

  // Calculate fare
  const distance = calculateDistance(
    ride.pickupLocation.coordinates.latitude,
    ride.pickupLocation.coordinates.longitude,
    ride.dropoffLocation.coordinates.latitude,
    ride.dropoffLocation.coordinates.longitude
  );

  const duration = estimateDuration(distance);
  ride.distance = distance;
  ride.duration = duration;
  ride.fare = await calculateFare(distance, duration);

  await ride.save();

  // Populate driver info
  await ride.populate("driver", "fullName phone profileImg rating");
  await ride.populate("passenger", "fullName phone profileImg");

  // Send notification to passenger
  const Notification = require("../models/notificationModel");
  await Notification.create({
    user: ride.passenger._id,
    title: "Driver Accepted Your Ride",
    titleAr: "قبل السائق رحلتك",
    message: `${driver.fullName} is on the way to pick you up`,
    messageAr: `${driver.fullName} في الطريق لاستلامك`,
    subtitle: `Ride #${ride._id.toString().slice(-6)}`,
    subtitleAr: `رحلة #${ride._id.toString().slice(-6)}`,
    type: "ride",
    data: { rideId: ride._id, driverId: driver._id },
  });

  // Emit socket event to passenger
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:accepted", ride);
  }

  res.status(200).json({
    status: "success",
    message: "Ride accepted successfully",
    data: ride,
  });
});

// @route   POST /api/v1/driver/rides/:rideId/complete
// @access  Private (Driver only)
exports.completeRide = asyncHandler(async (req, res, next) => {
  const { amountPaid, addChangeToWallet } = req.body;
  const ride = await Ride.findById(req.params.rideId)
    .populate("driver", "fullName phone profileImg")
    .populate("passenger", "fullName phone profileImg");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver._id.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (ride.status !== "arrived" && ride.status !== "started") {
    return next(new ApiError("Invalid ride status", 400));
  }

  ride.status = "completed";
  ride.completedAt = new Date();
  ride.paymentStatus = ride.paymentMethod === "cash" ? "paid" : "pending";
  
  // Handle Cash Payment Change
  if (ride.paymentMethod === "cash" && amountPaid && amountPaid > ride.finalFare && addChangeToWallet) {
    const change = amountPaid - ride.finalFare;
    const { deductFromWallet } = require("./walletController");
    
    // Add change to passenger wallet
    const Wallet = require("../models/walletModel");
    let passengerWallet = await Wallet.findOne({ user: ride.passenger._id });
    if (!passengerWallet) {
      passengerWallet = await Wallet.create({ user: ride.passenger._id, balance: 0 });
    }
    
    const balanceBefore = passengerWallet.balance; // Save balance BEFORE update
    passengerWallet.balance += change;
    passengerWallet.transactions.push({
      type: "refund", // or 'change_deposit'
      amount: change,
      description: `Change from ride ${ride._id}`,
      rideId: ride._id,
      balanceBefore: balanceBefore,
      balanceAfter: passengerWallet.balance
    });
    await passengerWallet.save();

    // Deduct change from driver wallet (allow overdraft)
    await deductFromWallet(req.user._id, change, ride._id, `Change added to passenger wallet`, true);
  }

  // Deduct Commission
  const Settings = require("../models/settingsModel");
  const settings = await Settings.findOne();
  const commissionRate = settings ? settings.appCommission : 10; // Default 10%
  const commissionAmount = (ride.finalFare * commissionRate) / 100;

  const { deductFromWallet } = require("./walletController");
  // Deduct commission from driver wallet (allow overdraft)
  await deductFromWallet(req.user._id, commissionAmount, ride._id, `Commission for ride ${ride._id}`, true);
  try {
    await deductFromWallet(req.user._id, commissionAmount, ride._id, `App commission (${commissionRate}%)`);
  } catch (err) {
    console.error("Failed to deduct commission:", err.message);
    // We might want to mark driver as "in debt" or block him if balance is too low
  }

  await ride.save();

  // Update driver earnings and stats
  const driver = await User.findById(req.user._id);
  driver.earnings.today += ride.fare;
  driver.earnings.thisWeek += ride.fare;
  driver.earnings.total += ride.fare;
  driver.totalRides += 1;
  
  // Award points (e.g., 10 points per ride)
  driver.points = (driver.points || 0) + 10;
  
  await driver.save();

  // Send completion notification to passenger
  const Notification = require("../models/notificationModel");
  await Notification.create({
    user: ride.passenger._id,
    title: "Ride Completed",
    titleAr: "اكتملت الرحلة",
    message: `Your ride has been completed. Fare: ${ride.finalFare} IQD`,
    messageAr: `اكتملت رحلتك. الأجرة: ${ride.finalFare} دينار عراقي`,
    subtitle: `Ride #${ride._id.toString().slice(-6)}`,
    subtitleAr: `رحلة #${ride._id.toString().slice(-6)}`,
    type: "ride",
    data: { rideId: ride._id },
  });

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:completed", ride);
  }

  res.status(200).json({
    status: "success",
    message: "Ride completed successfully",
    data: ride,
  });
});

// @desc    Cancel ride
// @route   POST /api/v1/driver/rides/:rideId/cancel
// @access  Private (Driver only)
exports.cancelRide = asyncHandler(async (req, res, next) => {
  const { reasonId } = req.body;
  
  if (!reasonId) {
    return next(new ApiError("Cancellation reason is required", 400));
  }

  // Validate cancellation reason
  const CancellationReason = require("../models/cancellationReasonModel");
  const cancellationReason = await CancellationReason.findOne({
    _id: reasonId,
    userType: "driver",
    isActive: true,
  });

  if (!cancellationReason) {
    return next(new ApiError("Invalid cancellation reason", 400));
  }

  const ride = await Ride.findById(req.params.rideId)
    .populate("driver", "fullName phone profileImg")
    .populate("passenger", "fullName phone profileImg");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver._id.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (ride.status === "completed" || ride.status === "cancelled") {
    return next(new ApiError("Cannot cancel this ride", 400));
  }

  // Check cancellation count for today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const todayCancellations = await Ride.countDocuments({
    driver: req.user._id,
    status: "cancelled",
    cancelledBy: "driver",
    cancelledAt: { $gte: startOfDay },
  });

  // Apply penalty if it's the 3rd cancellation (count is 2 before this one)
  let penaltyApplied = false;
  if (todayCancellations >= 2) {
    const { deductFromWallet } = require("./walletController");
    try {
      await deductFromWallet(
        req.user._id, 
        1000, 
        ride._id, 
        "Penalty for 3rd ride cancellation today",
        true // Allow overdraft
      );
      penaltyApplied = true;
    } catch (err) {
      console.error("Failed to deduct penalty:", err.message);
    }
  }

  ride.status = "cancelled";
  ride.cancelledBy = "driver";
  ride.cancellationReasonId = reasonId;
  ride.cancellationReason = cancellationReason.reason; // For backward compatibility
  ride.cancelledAt = new Date();
  await ride.save();

  // Send notification to passenger
  const Notification = require("../models/notificationModel");
  await Notification.create({
    user: ride.passenger._id,
    title: "Driver Cancelled Ride",
    titleAr: "ألغى السائق الرحلة",
    message: `Driver cancelled the ride. Reason: ${cancellationReason.reason}`,
    messageAr: `ألغى السائق الرحلة. السبب: ${cancellationReason.reasonAr}`,
    subtitle: `Ride #${ride._id.toString().slice(-6)}`,
    subtitleAr: `رحلة #${ride._id.toString().slice(-6)}`,
    type: "ride",
    data: { rideId: ride._id },
  });

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:cancelled", {
      ride,
      cancelledBy: "driver",
      reason: cancellationReason.reason,
      reasonAr: cancellationReason.reasonAr,
    });
  }

  res.status(200).json({
    status: "success",
    message: penaltyApplied 
      ? "Ride cancelled. 1000 IQD penalty applied (3rd cancellation today)" 
      : "Ride cancelled",
    data: ride,
    penaltyApplied,
  });
});

// @desc    Get active ride
// @route   GET /api/v1/driver/rides/active
// @access  Private (Driver only)
exports.getActiveRide = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findOne({
    driver: req.user._id,
    status: { $in: ["accepted", "started", "arrived"] },
  })
    .populate("driver", "fullName phone profileImg rating")
    .populate("passenger", "fullName phone profileImg rating");

  if (!ride) {
    return res.status(200).json({
      status: "success",
      data: null,
    });
  }

  res.status(200).json({
    status: "success",
    data: ride,
  });
});

// @desc    Get ride history
// @route   GET /api/v1/driver/rides/history
// @access  Private (Driver only)
exports.getRideHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const rides = await Ride.find({
    driver: req.user._id,
    status: { $in: ["completed", "cancelled"] },
  })
    .populate("passenger", "fullName profileImg rating")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Ride.countDocuments({
    driver: req.user._id,
    status: { $in: ["completed", "cancelled"] },
  });

  res.status(200).json({
    status: "success",
    results: rides.length,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
    data: rides,
  });
});

// @desc    Rate passenger
// @route   POST /api/v1/driver/rides/:rideId/rate
// @access  Private (Driver only)
exports.ratePassenger = asyncHandler(async (req, res, next) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return next(new ApiError("Rating must be between 1 and 5", 400));
  }

  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (ride.status !== "completed") {
    return next(new ApiError("Can only rate completed rides", 400));
  }

  if (ride.passengerRating) {
    return next(new ApiError("You have already rated this passenger", 400));
  }

  ride.passengerRating = rating;
  ride.passengerReview = review;
  await ride.save();

  // Update passenger's overall rating
  const passenger = await User.findById(ride.passenger);
  const totalRatings = passenger.totalRatings || 0;
  const currentRating = passenger.rating || 0;

  passenger.rating = (currentRating * totalRatings + rating) / (totalRatings + 1);
  passenger.totalRatings = totalRatings + 1;
  await passenger.save();

  res.status(200).json({
    status: "success",
    message: "Rating submitted successfully",
    data: ride,
  });
});

// @desc    Update meter distance (for rides without fixed destination)
// @route   PUT /api/v1/driver/rides/:rideId/update-meter
// @access  Private (Driver only)
exports.updateMeterDistance = asyncHandler(async (req, res, next) => {
  const { distance } = req.body;

  if (!distance || distance <= 0) {
    return next(new ApiError("Valid distance is required", 400));
  }

  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (!ride.isMeterMode) {
    return next(new ApiError("This ride is not in meter mode", 400));
  }

  if (ride.status !== "started") {
    return next(new ApiError("Ride must be in progress to update meter", 400));
  }

  ride.meterDistance = distance;
  await ride.save();

  res.status(200).json({
    status: "success",
    message: "Meter distance updated",
    data: {
      meterDistance: ride.meterDistance,
    },
  });
});

// @desc    Get upcoming nearby rides (while completing current ride)
// @route   GET /api/v1/driver/rides/upcoming-nearby
// @access  Private (Driver only)
exports.getUpcomingNearbyRides = asyncHandler(async (req, res, next) => {
  const { radius = 5 } = req.query; // Default 5km radius

  // Check if driver has an active ride
  const activeRide = await Ride.findOne({
    driver: req.user._id,
    status: { $in: ["started", "arrived"] },
  });

  if (!activeRide) {
    return next(new ApiError("You don't have an active ride", 400));
  }

  // Get destination coordinates
  const destinationCoords = activeRide.dropoffLocation.coordinates;

  // Find pending rides near the destination
  const pendingRides = await Ride.find({
    status: "pending",
    driver: null,
  })
    .populate("passenger", "fullName phone profileImg rating")
    .sort({ createdAt: 1 })
    .limit(10);

  // Filter rides within radius of destination
  const { isWithinRadius } = require("../utils/distanceCalculator");
  const nearbyRides = pendingRides.filter((ride) =>
    isWithinRadius(
      destinationCoords,
      ride.pickupLocation.coordinates,
      +radius
    )
  );

  res.status(200).json({
    status: "success",
    results: nearbyRides.length,
    data: nearbyRides,
  });
});

// @desc    Respond to safety check
// @route   POST /api/v1/driver/rides/:rideId/safety-check
// @access  Private (Driver only)
exports.respondToSafetyCheck = asyncHandler(async (req, res, next) => {
  const { response } = req.body; // "ok" or "emergency"

  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (!ride.hasRestStop) {
    return next(new ApiError("This ride doesn't have a rest stop", 400));
  }

  ride.safetyCheckStatus.responded = true;
  ride.safetyCheckStatus.responseTime = new Date();

  if (response === "emergency") {
    ride.safetyCheckStatus.emergencyTriggered = true;
    
    // Notify admin about emergency
    const io = req.app.get("io");
    if (io) {
      io.to("admin_room").emit("emergency:alert", {
        rideId: ride._id,
        driver: req.user._id,
        driverName: req.user.fullName,
        location: ride.restStopLocation,
        time: new Date(),
      });
    }
  }

  await ride.save();

  res.status(200).json({
    status: "success",
    message: response === "emergency" 
      ? "Emergency alert sent to admin" 
      : "Safety check confirmed",
    data: ride.safetyCheckStatus,
  });
});
