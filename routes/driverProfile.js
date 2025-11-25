const express = require("express");
const {
  uploadLicenseFront,
  uploadLicenseBack,
  uploadCarRegistration,
  uploadNationalId,
  uploadCarPhotos,
  submitForReview,
  getVerificationStatus,
} = require("../controllers/driverProfileController");

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

const { protect, allowedTo } = require("../midlewares/roleMiddleware");
const { uploadSingleImage, uploadMixOfImages } = require("../midlewares/uploadImageMiddleWare");

const router = express.Router();

// 🪪 لازم يكون سواق فقط
// Note: Profile routes are accessible even when status is "pending"
// to allow new drivers to upload documents before approval
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

// ============================================
// Profile Routes (accessible even when pending)
// ============================================

router.post("/profile/license-front", uploadSingleImage("licenseFront"), uploadLicenseFront);
router.post("/profile/license-back", uploadSingleImage("licenseBack"), uploadLicenseBack);

router.post(
  "/profile/car-registration",
  uploadMixOfImages([
    { name: "carRegFront", maxCount: 1 },
    { name: "carRegBack", maxCount: 1 },
  ]),
  uploadCarRegistration
);

router.post(
  "/profile/car-photos",
  uploadMixOfImages([{ name: "carPhotos", maxCount: 5 }]),
  uploadCarPhotos
);

router.post(
  "/profile/national-id",
  uploadMixOfImages([
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
  ]),
  uploadNationalId
);

router.post("/profile/submit-review", submitForReview);
router.get("/profile/status", getVerificationStatus);

// ============================================
// Driver Status Routes (require active status)
// ============================================

router.put("/status/toggle", requireActive, toggleOnlineStatus);
router.put("/location", requireActive, updateLocation);
router.get("/earnings", requireActive, getEarnings);
router.put("/settings", requireActive, updateSettings);
router.get("/heatmap", requireActive, getHeatMap);
router.get("/dashboard", requireActive, getDashboard);

// ============================================
// Ride Management Routes (require active status)
// ============================================

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
