const express = require("express");
const { protect, allowedTo } = require("../midlewares/roleMiddleware");
const { 
  getPendingDrivers, 
  approveDriver, 
  rejectDriver, 
  getAllUsers, 
  createDriverByAdmin, 
  getUserById, 
  createAdminByAdmin, 
  updateAdminStatus, 
  deleteUserByAdmin,
  getAllRides,
  getRideStats,
  getRideById,
  createVoucher,
  getAllVouchers,
  updateVoucher,
  deleteVoucher,
  getAllWalletTransactions,
  getAllComplaints,
  getComplaintStats,
  getComplaintById,
  replyToComplaint,
  updateComplaintStatus
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, allowedTo("admin"));

// ============================================
// Driver Management
// ============================================
router.get("/pending-drivers", getPendingDrivers);
router.put("/approve/:id", approveDriver);
router.put("/reject/:id", rejectDriver);
router.post("/drivers/create", createDriverByAdmin);

// ============================================
// User Management
// ============================================
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.delete("/delete-user/:id", deleteUserByAdmin);

// ============================================
// Admin Management
// ============================================
router.post("/add-admin", createAdminByAdmin);
router.put("/approve-admin/:id", updateAdminStatus);

// ============================================
// Ride Management
// ============================================
router.get("/rides", getAllRides);
router.get("/rides/stats", getRideStats);
router.get("/rides/:id", getRideById);

// ============================================
// Voucher Management
// ============================================
router.post("/vouchers", createVoucher);
router.get("/vouchers", getAllVouchers);
router.put("/vouchers/:id", updateVoucher);
router.delete("/vouchers/:id", deleteVoucher);

// ============================================
// Wallet Management
// ============================================
router.get("/wallets", getAllWalletTransactions);

// ============================================
// Complaints Management
// ============================================
router.get("/complaints", getAllComplaints);
router.get("/complaints/stats", getComplaintStats);
router.get("/complaints/:id", getComplaintById);
router.post("/complaints/:id/reply", replyToComplaint);
router.put("/complaints/:id/status", updateComplaintStatus);

// ============================================
// Settings Management
// ============================================
const { 
  getSettings, 
  updateSettings, 
  createSettings, 
  deleteSettings,
  getPricingSettings,
  updatePricingSettings,
  getVehicleMultipliers,
  updateVehicleMultiplier
} = require("../controllers/settingsController");

router.post("/settings", createSettings);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.delete("/settings", deleteSettings);

// Pricing routes
router.get("/pricing", getPricingSettings);
router.put("/pricing", updatePricingSettings);
router.get("/pricing/vehicles", getVehicleMultipliers);
router.put("/pricing/vehicles/:type", updateVehicleMultiplier);

// ============================================
// City Management
// ============================================
const { 
  createCity, 
  getAllCities, 
  getCity, 
  updateCity, 
  deleteCity,
  toggleCityStatus
} = require("../controllers/cityController");

router.post("/cities", createCity);
router.get("/cities", getAllCities);
router.get("/cities/:id", getCity);
router.put("/cities/:id", updateCity);
router.delete("/cities/:id", deleteCity);
router.put("/cities/:id/toggle-status", toggleCityStatus);

// ============================================
// Statistics & Reports
// ============================================
const {
  getDashboardOverview,
  getRideStats: getStatsRideStats,
  getRevenueAnalysis,
  getTopDrivers,
  getTopPassengers,
  getRidesChartData,
  getRevenueChartData
} = require("../controllers/statsController");

router.get("/stats/dashboard", getDashboardOverview);
router.get("/stats/rides", getStatsRideStats);
router.get("/stats/revenue", getRevenueAnalysis);
router.get("/stats/top-drivers", getTopDrivers);
router.get("/stats/top-passengers", getTopPassengers);
router.get("/stats/charts/rides", getRidesChartData);
router.get("/stats/charts/revenue", getRevenueChartData);

module.exports = router;
