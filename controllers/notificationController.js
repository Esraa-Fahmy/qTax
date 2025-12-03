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

// @desc    Mark notification(s) as read
// @route   PUT /api/v1/passenger/notifications/mark-read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { notificationIds, markAll } = req.body;

  // Mark all notifications as read
  if (markAll === true) {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  }

  // Mark specific notification(s) as read
  if (!notificationIds || (Array.isArray(notificationIds) && notificationIds.length === 0)) {
    return next(new ApiError("Please provide notification IDs or set markAll to true", 400));
  }

  // Handle single ID or array of IDs
  const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

  const result = await Notification.updateMany(
    { _id: { $in: ids }, user: req.user._id },
    { isRead: true }
  );

  res.status(200).json({
    status: "success",
    message: `${result.modifiedCount} notification(s) marked as read`,
    modifiedCount: result.modifiedCount,
  });
});

// @desc    Mark all notifications as read (legacy endpoint)
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
