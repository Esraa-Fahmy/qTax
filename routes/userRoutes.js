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

router.use(protect);

router.get("/me", getMyProfile);
router.put(
  "/updateMe",
  uploadUserImage,
  resizeImage,
  updateMyProfile
);
router.post("/verify-new-phone", verifyNewPhone);
router.delete("/deleteMe", deleteMyAccount);


module.exports = router;
