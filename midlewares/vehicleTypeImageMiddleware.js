const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");

/**
 * Resize and save vehicle type image
 */
exports.resizeVehicleTypeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  const filename = `vehicle-type-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(800, 600) // Resize to 800x600
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/vehicle-types/${filename}`);

  // Save filename to body for database
  req.body.image = filename;

  next();
});
