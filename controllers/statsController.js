const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Ride = require("../models/rideModel");
const Wallet = require("../models/walletModel");

// @desc    Get dashboard overview
// @route   GET /api/v1/admin/stats/dashboard
// @access  Private (Admin only)
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    totalPassengers,
    totalDrivers,
    totalRides,
    completedRides,
    activeRides,
    totalRevenue,
    todayRevenue,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "driver" }),
    Ride.countDocuments(),
    Ride.countDocuments({ status: "completed" }),
    Ride.countDocuments({ status: { $in: ["pending", "accepted", "started", "arrived"] } }),
    Ride.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$finalFare" } } },
    ]),
    Ride.aggregate([
      { $match: { status: "completed", createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$finalFare" } } },
    ]),
  ]);
  
  res.status(200).json({
    status: "success",
    data: {
      totalPassengers,
      totalDrivers,
      totalRides,
      completedRides,
      activeRides,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
    },
  });
});

// @desc    Get ride statistics
// @route   GET /api/v1/admin/stats/rides
// @access  Private (Admin only)
exports.getRideStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const byStatus = await Ride.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  
  const stats = {
    total: 0,
    pending: 0,
    accepted: 0,
    started: 0,
    arrived: 0,
    completed: 0,
    cancelled: 0,
  };
  
  byStatus.forEach(item => {
    stats[item._id] = item.count;
    stats.total += item.count;
  });
  
  res.status(200).json({
    status: "success",
    data: stats,
  });
});

// @desc    Get revenue analysis
// @route   GET /api/v1/admin/stats/revenue
// @access  Private (Admin only)
exports.getRevenueAnalysis = asyncHandler(async (req, res) => {
  const { period = 'daily' } = req.query; // daily, weekly, monthly
  
  let groupBy;
  switch (period) {
    case 'weekly':
      groupBy = { $week: "$createdAt" };
      break;
    case 'monthly':
      groupBy = { $month: "$createdAt" };
      break;
    default:
      groupBy = { $dayOfMonth: "$createdAt" };
  }
  
  const revenue = await Ride.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: groupBy,
        totalRevenue: { $sum: "$finalFare" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.status(200).json({
    status: "success",
    data: revenue,
  });
});

// @desc    Get top drivers
// @route   GET /api/v1/admin/stats/top-drivers
// @access  Private (Admin only)
exports.getTopDrivers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const topDrivers = await Ride.aggregate([
    { $match: { status: "completed", driver: { $exists: true } } },
    {
      $group: {
        _id: "$driver",
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: "$finalFare" },
        avgRating: { $avg: "$driverRating" }
      }
    },
    { $sort: { totalRides: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "driverInfo"
      }
    },
    { $unwind: "$driverInfo" },
    {
      $project: {
        _id: 1,
        totalRides: 1,
        totalEarnings: 1,
        avgRating: 1,
        fullName: "$driverInfo.fullName",
        phone: "$driverInfo.phone",
        profileImg: "$driverInfo.profileImg"
      }
    }
  ]);
  
  res.status(200).json({
    status: "success",
    results: topDrivers.length,
    data: topDrivers,
  });
});

// @desc    Get top passengers
// @route   GET /api/v1/admin/stats/top-passengers
// @access  Private (Admin only)
exports.getTopPassengers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const topPassengers = await Ride.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$passenger",
        totalRides: { $sum: 1 },
        totalSpent: { $sum: "$finalFare" }
      }
    },
    { $sort: { totalRides: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "passengerInfo"
      }
    },
    { $unwind: "$passengerInfo" },
    {
      $project: {
        _id: 1,
        totalRides: 1,
        totalSpent: 1,
        fullName: "$passengerInfo.fullName",
        phone: "$passengerInfo.phone",
        profileImg: "$passengerInfo.profileImg"
      }
    }
  ]);
  
  res.status(200).json({
    status: "success",
    results: topPassengers.length,
    data: topPassengers,
  });
});

// @desc    Get rides chart data
// @route   GET /api/v1/admin/stats/charts/rides
// @access  Private (Admin only)
exports.getRidesChartData = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);
  
  const chartData = await Ride.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);
  
  res.status(200).json({
    status: "success",
    data: chartData,
  });
});

// @desc    Get revenue chart data
// @route   GET /api/v1/admin/stats/charts/revenue
// @access  Private (Admin only)
exports.getRevenueChartData = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);
  
  const chartData = await Ride.aggregate([
    { $match: { status: "completed", createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        revenue: { $sum: "$finalFare" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);
  
  res.status(200).json({
    status: "success",
    data: chartData,
  });
});
