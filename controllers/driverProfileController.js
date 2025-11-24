const asyncHandler = require("express-async-handler");
const DriverProfile = require("../models/driverProfileModel");
const ApiError = require("../utils/apiError");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "../uploads/drivers");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const setImageURL = (req, fileName) =>
  `${process.env.BASE_URL}/uploads/drivers/${fileName}`;

// 1️⃣ Upload license front
exports.uploadLicenseFront = asyncHandler(async (req, res, next) => {
  if (!req.file)
    return next(new ApiError("License front image is required", 400));

  const fileName = `driver-${req.user._id}-licenseFront-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .toFormat("jpeg")
    .jpeg({ quality: 100 })
    .toFile(`${uploadsDir}/${fileName}`);

  let profile = await DriverProfile.findOne({ user: req.user._id });
  if (!profile) profile = new DriverProfile({ user: req.user._id });

  profile.licenseFront = fileName; // ✅ Save filename only
  profile.verificationStatus = "pending";
  await profile.save();

  res.status(200).json({
    status: "success",
    message: "License front uploaded. Proceed to upload the back side.",
    nextStep: "upload-license-back",
    imageUrl: `${process.env.BASE_URL}/uploads/drivers/${fileName}`,
  });
});

// 2️⃣ Upload license back
exports.uploadLicenseBack = asyncHandler(async (req, res, next) => {
  const profile = await DriverProfile.findOne({ user: req.user._id });
  if (!profile || !profile.licenseFront)
    return next(new ApiError("Please upload license front first.", 400));

  if (!req.file) return next(new ApiError("License back image is required", 400));

  const fileName = `driver-${req.user._id}-licenseBack-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .toFormat("jpeg")
    .jpeg({ quality: 100 })
    .toFile(`${uploadsDir}/${fileName}`);

  profile.licenseBack = fileName; // ✅ Save filename only
  await profile.save();

  res.status(200).json({
    status: "success",
    message: "License back uploaded. Proceed to upload car registration.",
    nextStep: "upload-car-registration",
    imageUrl: `${process.env.BASE_URL}/uploads/drivers/${fileName}`,
  });
});

// 3️⃣ Upload car registration (front + back)
exports.uploadCarRegistration = asyncHandler(async (req, res, next) => {
  const profile = await DriverProfile.findOne({ user: req.user._id });
  if (!profile || !profile.licenseBack)
    return next(new ApiError("Please upload your driving license first.", 400));
  if (!req.files || !req.files.carRegFront || !req.files.carRegBack)
    return next(new ApiError("Both car registration images are required", 400));

  const frontName = `driver-${req.user._id}-carFront-${Date.now()}.jpeg`;
  const backName = `driver-${req.user._id}-carBack-${Date.now()}.jpeg`;

  await sharp(req.files.carRegFront[0].buffer).toFile(`${uploadsDir}/${frontName}`);
  await sharp(req.files.carRegBack[0].buffer).toFile(`${uploadsDir}/${backName}`);

  profile.carRegFront = frontName; // ✅ Save filename only
  profile.carRegBack = backName;   // ✅ Save filename only
  await profile.save();

  res.status(200).json({
    status: "success",
    message: "Car registration uploaded. Proceed to upload car photos.",
    nextStep: "upload-car-photos",
    imageUrls: {
      front: `${process.env.BASE_URL}/uploads/drivers/${frontName}`,
      back: `${process.env.BASE_URL}/uploads/drivers/${backName}`,
    },
  });
});

// 4️⃣ Upload multiple car photos (max 5)
exports.uploadCarPhotos = asyncHandler(async (req, res, next) => {
  const profile = await DriverProfile.findOne({ user: req.user._id });
  if (!profile || !profile.carRegFront || !profile.carRegBack)
    return next(new ApiError("Please upload car registration first.", 400));

  if (!req.files || !req.files.carPhotos || req.files.carPhotos.length === 0)
    return next(new ApiError("At least one car photo is required", 400));

  if (req.files.carPhotos.length > 5)
    return next(new ApiError("You can upload up to 5 car photos only", 400));

  const carPhotos = [];
  const carPhotoUrls = [];

  for (const file of req.files.carPhotos) {
    const fileName = `driver-${req.user._id}-carPhoto-${Date.now()}-${Math.round(
      Math.random() * 1e4
    )}.jpeg`;

    await sharp(file.buffer)
      .toFormat("jpeg")
      .jpeg({ quality: 100 })
      .toFile(`${uploadsDir}/${fileName}`);

    carPhotos.push(fileName); // ✅ Save filename only
    carPhotoUrls.push(`${process.env.BASE_URL}/uploads/drivers/${fileName}`);
  }

  profile.carPhotos = carPhotos;
  await profile.save();

  res.status(200).json({
    status: "success",
    message: "Car photos uploaded successfully. Proceed to upload your national ID.",
    nextStep: "upload-national-id",
    uploadedCount: carPhotos.length,
    imageUrls: carPhotoUrls,
  });
});

// 5️⃣ Upload National ID (front + back)
exports.uploadNationalId = asyncHandler(async (req, res, next) => {
  const profile = await DriverProfile.findOne({ user: req.user._id });
  if (!profile || !profile.carRegFront || !profile.carRegBack)
    return next(new ApiError("Please upload car registration first.", 400));

  if (!req.files.nationalIdFront || !req.files.nationalIdBack)
    return next(new ApiError("Both national ID images are required", 400));

  const frontName = `driver-${req.user._id}-nidFront-${Date.now()}.jpeg`;
  const backName = `driver-${req.user._id}-nidBack-${Date.now()}.jpeg`;
  
  await sharp(req.files.nationalIdFront[0].buffer).toFile(`${uploadsDir}/${frontName}`);
  await sharp(req.files.nationalIdBack[0].buffer).toFile(`${uploadsDir}/${backName}`);

  profile.nationalIdFront = frontName; // ✅ Save filename only
  profile.nationalIdBack = backName;   // ✅ Save filename only
  profile.verificationStatus = "pending";
  await profile.save();

  res.status(200).json({
    status: "success",
    message: "All documents uploaded successfully. Awaiting admin review.",
    verificationStatus: "pending",
    imageUrls: {
      front: `${process.env.BASE_URL}/uploads/drivers/${frontName}`,
      back: `${process.env.BASE_URL}/uploads/drivers/${backName}`,
    },
  });
});




// ✅ 5️⃣ Submit all documents for admin review
exports.submitForReview = asyncHandler(async (req, res, next) => {
  const profile = await DriverProfile.findOne({ user: req.user._id });
  if (!profile)
    return next(new ApiError("Driver profile not found.", 404));

  // تأكد إن السواق فعلاً رفع كل المطلوب
  if (
    !profile.licenseFront ||
    !profile.licenseBack ||
    !profile.carRegFront ||
    !profile.carRegBack ||
    !profile.nationalIdFront ||
    !profile.nationalIdBack
  ) {
    return next(
      new ApiError(
        "Please complete all document uploads before submitting for review.",
        400
      )
    );
  }

  profile.verificationStatus = "pending";
  await profile.save();

  res.status(200).json({
    status: "success",
    message: "Your verification request has been submitted. Awaiting admin review.",
    verificationStatus: profile.verificationStatus,
  });
});


// ✅ 6️⃣ Check verification status
exports.getVerificationStatus = asyncHandler(async (req, res, next) => {
  const profile = await DriverProfile.findOne({ user: req.user._id });
  if (!profile)
    return next(new ApiError("Driver profile not found.", 404));

  res.status(200).json({
    status: "success",
    verificationStatus: profile.verificationStatus,
    rejectionReason: profile.rejectionReason || null,
    message:
      profile.verificationStatus === "approved"
        ? "Your account is approved. You can now use the driver app."
        : profile.verificationStatus === "pending"
        ? "Your documents are under review."
        : "Your verification request was rejected. Please check the reason.",
  });
});
