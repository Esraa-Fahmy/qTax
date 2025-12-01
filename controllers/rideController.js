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

  // TODO: Emit socket event to passenger
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

// @desc    Start ride
// @route   POST /api/v1/driver/rides/:rideId/start
// @access  Private (Driver only)
exports.startRide = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findById(req.params.rideId)
    .populate("driver", "fullName phone profileImg")
    .populate("passenger", "fullName phone profileImg");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver._id.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (ride.status !== "accepted") {
    return next(new ApiError("Ride must be accepted first", 400));
  }

  ride.status = "started";
  ride.startedAt = new Date();
  await ride.save();

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:started", ride);
  }

  res.status(200).json({
    status: "success",
    message: "Ride started successfully",
    data: ride,
  });
});

// @desc    Mark arrived at destination
// @route   POST /api/v1/driver/rides/:rideId/arrive
// @access  Private (Driver only)
exports.arriveAtDestination = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findById(req.params.rideId)
    .populate("driver", "fullName phone profileImg")
    .populate("passenger", "fullName phone profileImg");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.driver._id.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not assigned to this ride", 403));
  }

  if (ride.status !== "started") {
    return next(new ApiError("Ride must be started first", 400));
  }

  ride.status = "arrived";
  ride.arrivedAt = new Date();
  await ride.save();

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:arrived", ride);
  }

  res.status(200).json({
    status: "success",
    message: "Marked as arrived",
    data: ride,
  });
});

// @desc    Complete ride
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
    
    passengerWallet.balance += change;
    passengerWallet.transactions.push({
      type: "refund", // or 'change_deposit'
      amount: change,
      description: `Change from ride ${ride._id}`,
      rideId: ride._id,
      balanceBefore: passengerWallet.balance - change,
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
  const { reason } = req.body;
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
  if (todayCancellations >= 2) {
    const { deductFromWallet } = require("./walletController");
    try {
      await deductFromWallet(
        req.user._id, 
        1000, 
        ride._id, 
        "Penalty for 3rd cancellation today"
      );
    } catch (err) {
      // If wallet deduction fails (e.g. insufficient funds), we still cancel but maybe log it or debt
      console.error("Failed to deduct penalty:", err.message);
    }
  }

  ride.status = "cancelled";
  ride.cancelledBy = "driver";
  ride.cancellationReason = reason || "No reason provided";
  ride.cancelledAt = new Date();
  await ride.save();

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`user_${ride.passenger._id}`).emit("ride:cancelled", {
      ride,
      cancelledBy: "driver",
      reason: ride.cancellationReason,
    });
  }

  res.status(200).json({
    status: "success",
    message: "Ride cancelled",
    data: ride,
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
    .populate("passenger", "fullName phone profileImg rating")
    .sort({ completedAt: -1, cancelledAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Ride.countDocuments({
    driver: req.user._id,
    status: { $in: ["completed", "cancelled"] },
  });

  res.status(200).json({
    status: "success",
    results: rides.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
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
