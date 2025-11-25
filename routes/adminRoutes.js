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


module.exports = router;
