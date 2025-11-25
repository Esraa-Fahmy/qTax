const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");
const ApiError = require("../utils/apiError");

// @desc    Get all notifications
// @route   GET /api/v1/passenger/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ user: req.user._id });
  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    status: "success",
    results: notifications.length,
    total,
    unreadCount,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: notifications,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/passenger/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return next(new ApiError("Notification not found", 404));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    status: "success",
    message: "Notification marked as read",
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/passenger/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/passenger/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return next(new ApiError("Notification not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Notification deleted",
  });
});

// @desc    Create notification (internal function)
exports.createNotification = async (userId, title, message, type, data) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    data,
  });

  // Emit Socket.io event
  const io = require("../app").app?.get("io");
  if (io) {
    io.to(`user_${userId}`).emit("notification:new", notification);
  }

  return notification;
};
