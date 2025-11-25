const express = require("express");
const { protect, allowedTo } = require("../midlewares/roleMiddleware");
const {
  getIncomingRides,
  acceptRide,
  startRide,
  arriveAtDestination,
  completeRide,
  cancelRide,
  getActiveRide,
  getRideHistory,
  ratePassenger,
} = require("../controllers/rideController");

const {
  toggleOnlineStatus,
  updateLocation,
  getEarnings,
  updateSettings,
  getHeatMap,
  getDashboard,
} = require("../controllers/driverStatusController");

const router = express.Router();

// Protect all routes and restrict to drivers only
router.use(protect, allowedTo("driver"));

// Middleware to check if driver is approved (active)
const requireActive = (req, res, next) => {
  if (req.user.status !== 'active') {
    return res.status(403).json({
      status: 'error',
      message: 'Your account is pending approval. Please complete your profile and wait for admin approval.',
      accountStatus: req.user.status
    });
  }
  next();
};

// Driver status routes (require active status)
router.put("/status/toggle", requireActive, toggleOnlineStatus);
router.put("/location", requireActive, updateLocation);
router.get("/earnings", requireActive, getEarnings);
router.put("/settings", requireActive, updateSettings);
router.get("/heatmap", requireActive, getHeatMap);
router.get("/dashboard", requireActive, getDashboard);

// Ride management routes (require active status)
router.get("/rides/incoming", requireActive, getIncomingRides);
router.get("/rides/active", requireActive, getActiveRide);
router.get("/rides/history", requireActive, getRideHistory);
router.post("/rides/:rideId/accept", requireActive, acceptRide);
router.post("/rides/:rideId/start", requireActive, startRide);
router.post("/rides/:rideId/arrive", requireActive, arriveAtDestination);
router.post("/rides/:rideId/complete", requireActive, completeRide);
router.post("/rides/:rideId/cancel", requireActive, cancelRide);
router.post("/rides/:rideId/rate", requireActive, ratePassenger);

module.exports = router;
