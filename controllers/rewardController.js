const asyncHandler = require("express-async-handler");
const Reward = require("../models/rewardModel");
const User = require("../models/userModel");
const Ride = require("../models/rideModel");
const ApiError = require("../utils/apiError");

// @desc    Get my rewards
// @route   GET /api/v1/driver/rewards
// @access  Private (Driver only)
exports.getMyRewards = asyncHandler(async (req, res, next) => {
  const rewards = await Reward.find({ driver: req.user._id }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: rewards.length,
    data: rewards,
  });
});

// @desc    Distribute rewards (Admin)
// @route   POST /api/v1/admin/rewards/distribute
// @access  Private (Admin only)
exports.distributeRewards = asyncHandler(async (req, res, next) => {
  const { period, periodStart, periodEnd, rewardsConfig } = req.body;

  // rewardsConfig example: [{ rank: 1, amount: 50000 }, { rank: 2, amount: 30000 }, { rank: 3, amount: 15000 }]

  if (!period || !periodStart || !periodEnd) {
    return next(new ApiError("Period details are required", 400));
  }

  // Find top drivers for the period
  const topDrivers = await Ride.aggregate([
    {
      $match: {
        status: "completed",
        completedAt: {
          $gte: new Date(periodStart),
          $lte: new Date(periodEnd),
        },
      },
    },
    {
      $group: {
        _id: "$driver",
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: "$finalFare" },
      },
    },
    { $sort: { totalRides: -1 } },
    { $limit: 3 },
  ]);

  const createdRewards = [];

  for (let i = 0; i < topDrivers.length; i++) {
    const driverStats = topDrivers[i];
    const rank = i + 1;
    const config = rewardsConfig.find((c) => c.rank === rank) || { amount: 0 };

    const reward = await Reward.create({
      driver: driverStats._id,
      period,
      periodStart,
      periodEnd,
      rank,
      totalRides: driverStats.totalRides,
      rewardAmount: config.amount,
      status: "distributed",
      distributedAt: Date.now(),
    });

    // Add to driver wallet
    const driver = await User.findById(driverStats._id);
    if (driver) {
      driver.walletBalance = (driver.walletBalance || 0) + config.amount;
      await driver.save();
      
      // Notify driver
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${driver._id}`).emit("notification:new", {
            title: "مبروك! لقد حصلت على مكافأة",
            message: `لقد حصلت على المركز ${rank} ومكافأة ${config.amount} دينار`,
            type: "system"
        });
      }
    }

    createdRewards.push(reward);
  }

  res.status(200).json({
    status: "success",
    message: "Rewards distributed successfully",
    data: createdRewards,
  });
});
