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

const { protect, allowedTo } = require("../midlewares/roleMiddleware");
const { uploadSingleImage, uploadMixOfImages } = require("../midlewares/uploadImageMiddleWare");

const router = express.Router();

// 🪪 لازم يكون سواق فقط
router.use(protect, allowedTo("driver"));

// مراحل رفع الصور
router.post("/license-front", uploadSingleImage("licenseFront"), uploadLicenseFront);
router.post("/license-back", uploadSingleImage("licenseBack"), uploadLicenseBack);

router.post(
  "/car-registration",
  uploadMixOfImages([
    { name: "carRegFront", maxCount: 1 },
    { name: "carRegBack", maxCount: 1 },
  ]),
  uploadCarRegistration
);


router.post(
  "/car-photos",
  uploadMixOfImages([{ name: "carPhotos", maxCount: 5 }]),
  uploadCarPhotos
);

router.post(
  "/national-id",
  uploadMixOfImages([
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
  ]),
  uploadNationalId
);


// ✅ Submit for review
router.post("/submit-review", submitForReview);

// ✅ Check verification status
router.get("/status", getVerificationStatus);


module.exports = router;
