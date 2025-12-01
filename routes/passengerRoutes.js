const express = require("express");
const { protect, allowedTo } = require("../midlewares/roleMiddleware");

// Ride controllers
const {
  requestRide,
  cancelRide,
  rateDriver,
  getActiveRide,
  getRideHistory,
  getNearbyDrivers,
  shareRideInfo,
  requestRideAgain,
} = require("../controllers/passengerRideController");

// Wallet controllers
const {
  getWallet,
  getTransactions,
  topUpWallet,
} = require("../controllers/walletController");

// Voucher controllers
const {
  applyVoucher,
  getAvailableVouchers,
} = require("../controllers/voucherController");

// Notification controllers
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// Address controllers (from userController)
const {
  saveAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} = require("../controllers/userController");

const router = express.Router();

// Protect all routes and restrict to passengers (users)
router.use(protect, allowedTo("user"));

// Ride routes
router.post("/rides/request", requestRide);
router.post("/rides/:rideId/cancel", cancelRide);
router.post("/rides/:rideId/rate", rateDriver);
router.post("/rides/:rideId/share", shareRideInfo);
router.post("/rides/:rideId/request-again", requestRideAgain);
router.get("/rides/active", getActiveRide);
router.get("/rides/history", getRideHistory);
router.get("/drivers/nearby", getNearbyDrivers);

// Wallet routes
router.get("/wallet", getWallet);
router.get("/wallet/transactions", getTransactions);
router.post("/wallet/topup", topUpWallet);

// Voucher routes
router.post("/vouchers/apply", applyVoucher);
router.get("/vouchers", getAvailableVouchers);

// Notification routes
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markAsRead);
router.put("/notifications/read-all", markAllAsRead);
router.delete("/notifications/:id", deleteNotification);

// Saved addresses routes (passenger-only)
router.post("/addresses", saveAddress);
router.get("/addresses", getAddresses);
router.get("/addresses/:id", getAddressById);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);

// Complaint routes
const { createComplaint, getMyComplaints } = require("../controllers/complaintController");
router.post("/complaints", createComplaint);
router.get("/complaints/my", getMyComplaints);

// Saved Rides routes
const { saveRide, getSavedRides, getSavedRide, updateSavedRide, deleteSavedRide } = require("../controllers/savedRideController");
router.post("/saved-rides", saveRide);
router.get("/saved-rides", getSavedRides);
router.get("/saved-rides/:id", getSavedRide);
router.put("/saved-rides/:id", updateSavedRide);
router.delete("/saved-rides/:id", deleteSavedRide);

module.exports = router;
