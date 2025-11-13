const express = require("express");
const { sendOtpCode, verifyOtpCode, registerAdmin, loginAdmin } = require("../controllers/authController");

const router = express.Router();

// Rider
router.post("/rider/phone", sendOtpCode);
router.post("/rider/verify-otp", verifyOtpCode);

// Driver
router.post("/driver/phone", sendOtpCode);
router.post("/driver/verify-otp", verifyOtpCode);


//admin
router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);

module.exports = router;
