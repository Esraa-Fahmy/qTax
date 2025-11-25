// routes/userRoutes.js
const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  verifyNewPhone,
  uploadUserImage,
  resizeImage,
  deleteMyAccount,
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

module.exports = router;
