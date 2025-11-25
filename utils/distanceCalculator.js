// utils/distanceCalculator.js

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @returns {Number} - Distance in kilometers
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if driver is within pickup radius
 * @param {Object} driverLocation - {latitude, longitude}
 * @param {Object} pickupLocation - {latitude, longitude}
 * @param {Number} radius - Radius in km
 * @returns {Boolean}
 */
exports.isWithinRadius = (driverLocation, pickupLocation, radius) => {
  const distance = this.calculateDistance(
    driverLocation.latitude,
    driverLocation.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude
  );

  return distance <= radius;
};

/**
 * Estimate duration based on distance (rough estimate)
 * @param {Number} distance - Distance in km
 * @returns {Number} - Estimated duration in minutes
 */
exports.estimateDuration = (distance) => {
  const AVERAGE_SPEED = 30; // km/h in city traffic
  const durationHours = distance / AVERAGE_SPEED;
  const durationMinutes = Math.ceil(durationHours * 60);
  
  return durationMinutes;
};
