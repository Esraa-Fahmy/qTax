// routes/userRoutes.js
const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  verifyNewPhone,
  uploadUserImage,
  resizeImage,
  deleteMyAccount,
  saveAddress,
  getAddresses,
  deleteAddress,
} = require("../controllers/userController");

const { protect } = require("../midlewares/roleMiddleware");

const router = express.Router();

// Protect all routes - available for all authenticated users
router.use(protect);

// Profile routes
router.get("/profile", getMyProfile);
router.put("/profile", uploadUserImage, resizeImage, updateMyProfile);
router.post("/profile/verify-phone", verifyNewPhone);
router.delete("/profile", deleteMyAccount);

// Saved addresses routes
router.post("/addresses", saveAddress);
router.get("/addresses", getAddresses);
router.delete("/addresses/:label", deleteAddress);

module.exports = router;
