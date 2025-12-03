const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");

/**
 * Resize and save vehicle type image
 */
exports.resizeVehicleTypeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  const filename = `vehicle-type-${uuidv4()}-${Date.now()}.jpeg`;
  
  // Create absolute path
  const uploadDir = path.join(__dirname, "..", "uploads", "vehicle-types");
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, filename);

  await sharp(req.file.buffer)
    .resize(800, 600) // Resize to 800x600
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(filePath);

  // Save filename to body for database
  req.body.image = filename;

  next();
});
