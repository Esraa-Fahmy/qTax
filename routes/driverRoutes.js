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

// Driver status routes
router.put("/status/toggle", toggleOnlineStatus);
router.put("/location", updateLocation);
router.get("/earnings", getEarnings);
router.put("/settings", updateSettings);
router.get("/heatmap", getHeatMap);
router.get("/dashboard", getDashboard);

// Ride management routes
router.get("/rides/incoming", getIncomingRides);
router.get("/rides/active", getActiveRide);
router.get("/rides/history", getRideHistory);
router.post("/rides/:rideId/accept", acceptRide);
router.post("/rides/:rideId/start", startRide);
router.post("/rides/:rideId/arrive", arriveAtDestination);
router.post("/rides/:rideId/complete", completeRide);
router.post("/rides/:rideId/cancel", cancelRide);
router.post("/rides/:rideId/rate", ratePassenger);

module.exports = router;
