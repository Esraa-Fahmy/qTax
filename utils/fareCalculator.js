// utils/fareCalculator.js

/**
 * Calculate fare based on distance, duration, and vehicle type
 * @param {Number} distance - Distance in km
 * @param {Number} duration - Duration in minutes
 * @param {String} vehicleType - 'economy', 'comfort', or 'premium'
 * @param {Object} options - Additional options (surge, etc.)
 * @returns {Number} - Calculated fare
 */
exports.calculateFare = (distance, duration, vehicleType = "economy", options = {}) => {
  // Vehicle type multipliers
  const VEHICLE_MULTIPLIERS = {
    economy: 1.0,
    comfort: 1.3,
    premium: 1.6,
  };

  const BASE_FARE = 10; // Base fare in EGP
  const PER_KM = 5; // Price per km
  const PER_MINUTE = 1; // Price per minute
  const MIN_FARE = 15; // Minimum fare

  let fare = BASE_FARE + (distance * PER_KM) + (duration * PER_MINUTE);

  // Apply vehicle type multiplier
  const multiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
  fare *= multiplier;

  // Apply surge pricing if provided
  if (options.surgeMultiplier && options.surgeMultiplier > 1) {
    fare *= options.surgeMultiplier;
  }

  // Ensure minimum fare
  fare = Math.max(fare, MIN_FARE);

  // Round to nearest 0.5
  fare = Math.round(fare * 2) / 2;

  return fare;
};

/**
 * Calculate cancellation fee
 * @param {String} cancelledBy - 'driver' or 'passenger'
 * @param {String} rideStatus - Current ride status
 * @returns {Number} - Cancellation fee
 */
exports.calculateCancellationFee = (cancelledBy, rideStatus) => {
  // No fee if cancelled before acceptance
  if (rideStatus === 'pending') return 0;

  // Driver cancels after accepting
  if (cancelledBy === 'driver' && rideStatus === 'accepted') {
    return 0; // No fee for driver, but affects their rating
  }

  // Passenger cancels after driver accepted
  if (cancelledBy === 'passenger' && rideStatus === 'accepted') {
    return 5; // Small cancellation fee
  }

  // Passenger cancels after ride started
  if (cancelledBy === 'passenger' && rideStatus === 'started') {
    return 20; // Higher cancellation fee
  }

  return 0;
};
