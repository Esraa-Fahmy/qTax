const express = require("express");
const { protect, allowedTo } = require("../midlewares/roleMiddleware");
const { getPendingDrivers, approveDriver, rejectDriver, getAllUsers, createDriverByAdmin, getUserById, createAdminByAdmin, updateAdminStatus, deleteUser, deleteUserByAdmin } = require("../controllers/adminController");

const router = express.Router();

router.use(protect, allowedTo("admin"));

router.get("/pending-drivers", getPendingDrivers);
router.get("/users", getAllUsers);
router.post("/drivers/create", createDriverByAdmin);
router.put("/approve-admin/:id", updateAdminStatus);
router.post("/add-admin", createAdminByAdmin);
router.put("/approve/:id", approveDriver);
router.put("/reject/:id", rejectDriver);
router.get("/users/:id", getUserById);
router.delete("/delete-user/:id", deleteUserByAdmin);

// Ride management routes
const { getAllRides, getRideStats, getRideById, createVoucher, getAllVouchers, updateVoucher, deleteVoucher, getAllWalletTransactions } = require("../controllers/adminController");
router.get("/rides", getAllRides);
router.get("/rides/stats", getRideStats);
router.get("/rides/:id", getRideById);

// Voucher management routes
router.post("/vouchers", createVoucher);
router.get("/vouchers", getAllVouchers);
router.put("/vouchers/:id", updateVoucher);
router.delete("/vouchers/:id", deleteVoucher);

// Wallet management routes
router.get("/wallets", getAllWalletTransactions);

// Settings management routes
const { getSettings, updateSettings, createSettings, deleteSettings } = require("../controllers/settingsController");
router.post("/settings", createSettings);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.delete("/settings", deleteSettings);

// City management routes
const { createCity, getAllCities, getCity, updateCity, deleteCity } = require("../controllers/cityController");
router.post("/cities", createCity);
router.get("/cities", getAllCities);
router.get("/cities/:id", getCity);
router.put("/cities/:id", updateCity);
router.delete("/cities/:id", deleteCity);

// Complaint management routes
const { getAllComplaints, updateComplaint } = require("../controllers/complaintController");
router.get("/complaints", getAllComplaints);
router.put("/complaints/:id", updateComplaint);

module.exports = router;
