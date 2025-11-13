const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

exports.protect = asyncHandler(async (req, res, next) => {
  // 1️⃣ check if token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ApiError("You are not logged in. Please login first.", 401));
  }

  // 2️⃣ verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3️⃣ check if user still exists
const currentUser = await User.findById(decoded.userId).populate("driverProfile");
  if (!currentUser) {
    return next(new ApiError("The user belonging to this token no longer exists.", 401));
  }

  // 4️⃣ attach user to request
  req.user = currentUser;
  next();
});



exports.allowedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("You are not allowed to access this route", 403));
    }
    next();
  };
};
