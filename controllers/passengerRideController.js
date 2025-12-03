const asyncHandler = require("express-async-handler");
const Ride = require("../models/rideModel");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const { calculateFare } = require("../utils/fareCalculator");
const { calculateDistance, estimateDuration, isWithinRadius } = require("../utils/distanceCalculator");
const { deductFromWallet } = require("./walletController");
const { markVoucherAsUsed } = require("./voucherController");
const Voucher = require("../models/voucherModel");

// @desc    Request a new ride
// @route   POST /api/v1/passenger/rides/request
// @access  Private (Passenger only)
exports.requestRide = asyncHandler(async (req, res, next) => {
  const {
    pickupAddress,
    pickupLatitude,
    pickupLongitude,
    dropoffAddress,
    dropoffLatitude,
    dropoffLongitude,
    stops = [], // Array of additional stops
    vehicleType = "economy",
    paymentMethod = "cash",
    voucherCode,
    useWallet = false,
    isScheduled = false,
    scheduledTime,
    isRoundTrip = false,
  } = req.body;

  // Validate required fields
  if (!pickupAddress || !pickupLatitude || !pickupLongitude || 
      !dropoffAddress || !dropoffLatitude || !dropoffLongitude) {
    return next(new ApiError("All location details are required", 400));
  }

  // Check if passenger already has an active ride
  const activeRide = await Ride.findOne({
    passenger: req.user._id,
    status: { $in: ["pending", "accepted", "started", "arrived"] },
  });

  if (activeRide) {
    return next(new ApiError("You already have an active ride", 400));
  }

  // Calculate total distance (including stops)
  let totalDistance = 0;
  let currentLat = pickupLatitude;
  let currentLng = pickupLongitude;

  // Calculate distance through stops
  if (stops && stops.length > 0) {
    for (const stop of stops) {
      const segmentDistance = calculateDistance(
        currentLat,
        currentLng,
        stop.latitude,
        stop.longitude
      );
      totalDistance += segmentDistance;
      currentLat = stop.latitude;
      currentLng = stop.longitude;
    }
  }

  // Add final segment to dropoff
  const finalSegment = calculateDistance(
    currentLat,
    currentLng,
    dropoffLatitude,
    dropoffLongitude
  );
  totalDistance += finalSegment;

  const duration = estimateDuration(totalDistance);
  let baseFare = await calculateFare(
    totalDistance, 
    duration, 
    vehicleType, 
    { latitude: pickupLatitude, longitude: pickupLongitude }
  );

  // Apply voucher if provided
  let voucherDiscount = 0;
  if (voucherCode) {
    const voucher = await Voucher.findOne({
      code: voucherCode.toUpperCase(),
      isActive: true,
    });

    if (voucher && new Date() <= voucher.expiryDate) {
      // Check usage
      const userUsageCount = voucher.usedBy.filter(
        (usage) => usage.user.toString() === req.user._id.toString()
      ).length;

      if (userUsageCount < voucher.usagePerUser && voucher.usedBy.length < voucher.usageLimit) {
        if (baseFare >= voucher.minRideAmount) {
          if (voucher.discountType === "fixed") {
            voucherDiscount = voucher.discountValue;
          } else if (voucher.discountType === "percentage") {
            voucherDiscount = (baseFare * voucher.discountValue) / 100;
            if (voucher.maxDiscount && voucherDiscount > voucher.maxDiscount) {
              voucherDiscount = voucher.maxDiscount;
            }
          }
          if (voucherDiscount > baseFare) voucherDiscount = baseFare;
        }
      }
    }
  }

  const fareAfterVoucher = baseFare - voucherDiscount;
  let walletAmountUsed = 0;
  let finalFare = fareAfterVoucher;

  // Apply wallet if requested
  if (useWallet && paymentMethod === "wallet") {
    const Wallet = require("../models/walletModel");
    const wallet = await Wallet.findOne({ user: req.user._id });
    
    if (wallet && wallet.balance > 0) {
      walletAmountUsed = Math.min(wallet.balance, fareAfterVoucher);
      finalFare = fareAfterVoucher - walletAmountUsed;
    }
  }

  // Format stops
  const formattedStops = stops.map((stop, index) => ({
    address: stop.address,
    coordinates: {
      latitude: stop.latitude,
      longitude: stop.longitude,
    },
    order: index + 1,
  }));

  // Create ride
  const ride = await Ride.create({
    passenger: req.user._id,
    pickupLocation: {
      address: pickupAddress,
      coordinates: {
        latitude: pickupLatitude,
        longitude: pickupLongitude,
      },
    },
    dropoffLocation: {
      address: dropoffAddress,
      coordinates: {
        latitude: dropoffLatitude,
        longitude: dropoffLongitude,
      },
    },
    stops: formattedStops,
    vehicleType,
    distance: totalDistance,
    duration,
    fare: baseFare,
    paymentMethod,
    voucherCode: voucherCode?.toUpperCase(),
    voucherDiscount,
    walletAmountUsed,
    finalFare,
    isScheduled,
    scheduledTime: isScheduled ? scheduledTime : null,
    isRoundTrip,
    status: "pending",
  });


  // Find nearby online drivers (only for non-scheduled rides)
  if (!isScheduled) {
    const onlineDrivers = await User.find({
      role: "driver",
      isOnline: true,
      status: "active",
      "currentLocation.latitude": { $exists: true },
    });

    // Filter drivers within radius and emit to them
    const io = req.app.get("io");
    if (io) {
      onlineDrivers.forEach((driver) => {
        if (
          driver.currentLocation &&
          isWithinRadius(
            driver.currentLocation,
            { latitude: pickupLatitude, longitude: pickupLongitude },
            driver.pickupRadius
          )
        ) {
          io.to(`user_${driver._id}`).emit("ride:new", {
            rideId: ride._id,
            pickup: ride.pickupLocation,
            dropoff: ride.dropoffLocation,
            stops: ride.stops,
            vehicleType: ride.vehicleType,
            fare: ride.finalFare,
            distance: ride.distance,
            passenger: {
              id: req.user._id,
              name: req.user.fullName,
              rating: req.user.rating,
            },
          });
        }
      });
    }
  }

  res.status(201).json({
    status: "success",
    message: "Ride requested successfully. Looking for nearby drivers...",
    data: {
      ride,
      pricing: {
        baseFare,
        voucherDiscount,
        walletAmountUsed,
        finalFare,
      },
    },
  });
});

// @desc    Cancel ride (passenger)
// @route   POST /api/v1/passenger/rides/:rideId/cancel
// @access  Private (Passenger only)
exports.cancelRide = asyncHandler(async (req, res, next) => {
  const { reasonId } = req.body;
  
  if (!reasonId) {
    return next(new ApiError("Cancellation reason is required", 400));
  }

  // Validate cancellation reason
  const CancellationReason = require("../models/cancellationReasonModel");
  const cancellationReason = await CancellationReason.findOne({
    _id: reasonId,
    userType: "passenger",
    isActive: true,
  });

  if (!cancellationReason) {
    return next(new ApiError("Invalid cancellation reason", 400));
  }

  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.passenger.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not authorized to cancel this ride", 403));
  }

  if (ride.status === "completed" || ride.status === "cancelled") {
    return next(new ApiError("Cannot cancel this ride", 400));
  }

  // Refund wallet if used
  if (ride.walletAmountUsed > 0) {
    const { refundToWallet } = require("./walletController");
    await refundToWallet(
      req.user._id,
      ride.walletAmountUsed,
      ride._id,
      "Refund for cancelled ride"
    );
  }

  ride.status = "cancelled";
  ride.cancelledBy = "passenger";
  ride.cancellationReasonId = reasonId;
  ride.cancellationReason = cancellationReason.reason; // For backward compatibility
  ride.cancelledAt = new Date();
  await ride.save();

  // Send notification to driver if assigned
  if (ride.driver) {
    const Notification = require("../models/notificationModel");
    await Notification.create({
      user: ride.driver,
      title: "Ride Cancelled",
      titleAr: "تم إلغاء الرحلة",
      message: `Passenger cancelled the ride. Reason: ${cancellationReason.reason}`,
      messageAr: `قام الراكب بإلغاء الرحلة. السبب: ${cancellationReason.reasonAr}`,
      subtitle: `Ride #${ride._id.toString().slice(-6)}`,
      subtitleAr: `رحلة #${ride._id.toString().slice(-6)}`,
      type: "ride",
      data: { rideId: ride._id },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${ride.driver}`).emit("ride:cancelled", {
        rideId: ride._id,
        cancelledBy: "passenger",
        reason: cancellationReason.reason,
        reasonAr: cancellationReason.reasonAr,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Ride cancelled successfully",
    data: ride,
  });
});

// @desc    Rate driver
// @route   POST /api/v1/passenger/rides/:rideId/rate
// @access  Private (Passenger only)
exports.rateDriver = asyncHandler(async (req, res, next) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return next(new ApiError("Rating must be between 1 and 5", 400));
  }

  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.passenger.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not authorized to rate this ride", 403));
  }

  if (ride.status !== "completed") {
    return next(new ApiError("Can only rate completed rides", 400));
  }

  if (ride.driverRating) {
    return next(new ApiError("You have already rated this driver", 400));
  }

  ride.driverRating = rating;
  ride.driverReview = review;
  await ride.save();

  // Update driver's overall rating
  const driver = await User.findById(ride.driver);
  const totalRatings = driver.totalRatings || 0;
  const currentRating = driver.rating || 0;

  driver.rating = (currentRating * totalRatings + rating) / (totalRatings + 1);
  driver.totalRatings = totalRatings + 1;
  await driver.save();

  res.status(200).json({
    status: "success",
    message: "Rating submitted successfully",
    data: ride,
  });
});

// @desc    Get active ride (passenger)
// @route   GET /api/v1/passenger/rides/active
// @access  Private (Passenger only)
exports.getActiveRide = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findOne({
    passenger: req.user._id,
    status: { $in: ["pending", "accepted", "started", "arrived"] },
  })
    .populate({
      path: "driver",
      select: "fullName phone profileImg rating totalRatings currentLocation driverProfile",
      populate: {
        path: "driverProfile",
        select: "carPhotos",
      },
    })
    .populate("passenger", "fullName phone profileImg");

  if (!ride) {
    return res.status(200).json({
      status: "success",
      data: null,
    });
  }

  // Enhance driver data with fallback photo
  if (ride.driver) {
    const driverData = {
      _id: ride.driver._id,
      fullName: ride.driver.fullName || null,
      phone: ride.driver.phone || null,
      profileImg: ride.driver.profileImg || null,
      rating: ride.driver.rating || 0,
      totalRatings: ride.driver.totalRatings || 0,
      currentLocation: ride.driver.currentLocation || null,
      vehicleType: ride.vehicleType,
    };

    // If no profile image, use first car photo as fallback
    if (!driverData.profileImg && ride.driver.driverProfile && ride.driver.driverProfile.carPhotos && ride.driver.driverProfile.carPhotos.length > 0) {
      driverData.profileImg = ride.driver.driverProfile.carPhotos[0];
    }

    // Create enhanced response
    const enhancedRide = ride.toObject();
    enhancedRide.driver = driverData;

    return res.status(200).json({
      status: "success",
      data: enhancedRide,
    });
  }

  res.status(200).json({
    status: "success",
    data: ride,
  });
});

// @desc    Get ride history (passenger)
// @route   GET /api/v1/passenger/rides/history
// @access  Private (Passenger only)
exports.getRideHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const rides = await Ride.find({
    passenger: req.user._id,
    status: { $in: ["completed", "cancelled"] },
  })
    .populate({
      path: "driver",
      select: "fullName phone profileImg rating driverProfile",
      populate: {
        path: "driverProfile",
        select: "carPhotos",
      },
    })
    .sort({ completedAt: -1, cancelledAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Ride.countDocuments({
    passenger: req.user._id,
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

// @desc    Get available drivers nearby
// @route   GET /api/v1/passenger/drivers/nearby
// @access  Private (Passenger only)
exports.getNearbyDrivers = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, radius = 10 } = req.query;

  if (!latitude || !longitude) {
    return next(new ApiError("Latitude and longitude are required", 400));
  }

  const onlineDrivers = await User.find({
    role: "driver",
    isOnline: true,
    "currentLocation.latitude": { $exists: true },
  }).select("fullName profileImg rating currentLocation");

  // Filter by distance
  const nearbyDrivers = onlineDrivers.filter((driver) =>
    isWithinRadius(
      driver.currentLocation,
      { latitude: +latitude, longitude: +longitude },
      +radius
    )
  );

  res.status(200).json({
    status: "success",
    results: nearbyDrivers.length,
    data: nearbyDrivers,
  });
});

// @desc    Share ride info
// @route   POST /api/v1/passenger/rides/:rideId/share
// @access  Private (Passenger only)
exports.shareRideInfo = asyncHandler(async (req, res, next) => {
  const ride = await Ride.findById(req.params.rideId)
    .populate("driver", "fullName phone profileImg")
    .populate("passenger", "fullName phone");

  if (!ride) {
    return next(new ApiError("Ride not found", 404));
  }

  if (ride.passenger._id.toString() !== req.user._id.toString()) {
    return next(new ApiError("Not authorized", 403));
  }

  const shareInfo = {
    rideId: ride._id,
    passenger: ride.passenger.fullName,
    driver: ride.driver ? ride.driver.fullName : "Not assigned yet",
    driverPhone: ride.driver ? ride.driver.phone : null,
    pickup: ride.pickupLocation.address,
    dropoff: ride.dropoffLocation.address,
    status: ride.status,
    vehicleType: ride.vehicleType,
    fare: ride.finalFare,
  };

  res.status(200).json({
    status: "success",
    message: "Ride info ready to share",
    data: shareInfo,
  });
});

// @desc    Request a ride again (from history)
// @route   POST /api/v1/passenger/rides/:rideId/request-again
// @access  Private (Passenger only)
exports.requestRideAgain = asyncHandler(async (req, res, next) => {
  // Find the original ride
  const originalRide = await Ride.findById(req.params.rideId);

  if (!originalRide) {
    return next(new ApiError("Ride not found", 404));
  }

  // Verify the passenger owns this ride
  if (originalRide.passenger.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not authorized to request this ride again", 403));
  }

  // Only allow requesting completed or cancelled rides again
  if (!["completed", "cancelled"].includes(originalRide.status)) {
    return next(new ApiError("Can only request completed or cancelled rides again", 400));
  }

  // Check if passenger already has an active ride
  const activeRide = await Ride.findOne({
    passenger: req.user._id,
    status: { $in: ["pending", "accepted", "started", "arrived"] },
  });

  if (activeRide) {
    return next(new ApiError("You already have an active ride", 400));
  }

  // Calculate fare for the new ride
  const totalDistance = originalRide.distance;
  const duration = originalRide.duration;
  let baseFare = await calculateFare(
    totalDistance,
    duration,
    originalRide.vehicleType,
    originalRide.pickupLocation.coordinates
  );

  // Create new ride with same details
  const newRide = await Ride.create({
    passenger: req.user._id,
    pickupLocation: originalRide.pickupLocation,
    dropoffLocation: originalRide.dropoffLocation,
    stops: originalRide.stops,
    vehicleType: originalRide.vehicleType,
    distance: totalDistance,
    duration,
    fare: baseFare,
    paymentMethod: originalRide.paymentMethod,
    voucherCode: null, // No voucher for repeated rides
    voucherDiscount: 0,
    walletAmountUsed: 0,
    finalFare: baseFare,
    isScheduled: false, // New ride is immediate, not scheduled
    scheduledTime: null,
    isRoundTrip: false,
    status: "pending",
  });

  // Find nearby online drivers
  const onlineDrivers = await User.find({
    role: "driver",
    isOnline: true,
    status: "active",
    "currentLocation.latitude": { $exists: true },
  });

  // Notify nearby drivers
  const io = req.app.get("io");
  if (io) {
    onlineDrivers.forEach((driver) => {
      if (
        driver.currentLocation &&
        isWithinRadius(
          driver.currentLocation,
          newRide.pickupLocation.coordinates,
          driver.pickupRadius
        )
      ) {
        io.to(`user_${driver._id}`).emit("ride:new", {
          rideId: newRide._id,
          pickup: newRide.pickupLocation,
          dropoff: newRide.dropoffLocation,
          stops: newRide.stops,
          vehicleType: newRide.vehicleType,
          fare: newRide.finalFare,
          distance: newRide.distance,
          passenger: {
            id: req.user._id,
            name: req.user.fullName,
            rating: req.user.rating,
          },
        });
      }
    });
  }

  res.status(201).json({
    status: "success",
    message: "Ride requested again successfully. Looking for nearby drivers...",
    data: {
      ride: newRide,
      originalRideId: originalRide._id,
    },
  });
});
