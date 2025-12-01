// utils/fareCalculator.js
const Settings = require("../models/settingsModel");
const City = require("../models/cityModel");
const { calculateDistance } = require("./distanceCalculator");

/**
 * Calculate fare based on distance, duration, and vehicle type
 * @param {Number} distance - Distance in km
 * @param {Number} duration - Duration in minutes
 * @param {String} vehicleType - 'economy', 'comfort', or 'premium'
 * @param {Object} pickupCoordinates - { latitude, longitude }
 * @param {Object} options - Additional options (surge, etc.)
 * @returns {Promise<Number>} - Calculated fare
 */
exports.calculateFare = async (distance, duration, vehicleType = "economy", pickupCoordinates = null, options = {}) => {
  let pricingConfig = null;

  // 1. Try to find a city covering this location
  if (pickupCoordinates && pickupCoordinates.latitude && pickupCoordinates.longitude) {
    // Find city where distance(city.location, pickup) <= city.radius
    // Since we don't have geospatial index fully set up for radius queries in this snippet context efficiently without 2dsphere,
    // we will fetch all active cities and check distance manually (assuming small number of cities).
    // For production with many cities, use $near or $geoIntersects.
    
    const cities = await City.find({ isActive: true });
    
    for (const city of cities) {
      if (city.location && city.location.coordinates) {
        const cityLat = city.location.coordinates[1];
        const cityLng = city.location.coordinates[0];
        
        const dist = calculateDistance(
          cityLat, 
          cityLng, 
          pickupCoordinates.latitude, 
          pickupCoordinates.longitude
        );

        if (dist <= city.radius) {
          pricingConfig = city;
          break; // Use the first matching city
        }
      }
    }
  }

  // 2. If no city found, use global settings
  if (!pricingConfig) {
    pricingConfig = await Settings.findOne();
    if (!pricingConfig) {
      // Fallback defaults
      pricingConfig = {
        baseFare: 10,
        pricePerKm: 5,
        pricePerMinute: 1,
        minFare: 15,
        vehicleMultipliers: { economy: 1.0, comfort: 1.3, premium: 1.6 },
        surgeMultiplier: 1.0,
        isSurgeActive: false,
      };
    }
  }

  const {
    baseFare,
    pricePerKm,
    pricePerMinute,
    minFare,
    vehicleMultipliers = { economy: 1.0, comfort: 1.3, premium: 1.6 }, // Default if missing in city
    surgeMultiplier = 1.0, // Default if missing in city
    isSurgeActive = false, // Default if missing in city
  } = pricingConfig;

  let fare = baseFare + (distance * pricePerKm) + (duration * pricePerMinute);

  // Apply vehicle type multiplier
  // Note: City model might not have vehicleMultipliers, so we might need to merge with global or use defaults
  // For now, assuming City model *should* have them or we fallback to global/default
  const multiplier = (vehicleMultipliers && vehicleMultipliers[vehicleType]) || 1.0;
  fare *= multiplier;

  // Apply surge pricing
  // If city doesn't have surge settings, we might want to check global settings or just ignore
  // Here we use what's in pricingConfig (which might be City or Settings)
  const activeSurge = options.surgeMultiplier || (isSurgeActive ? surgeMultiplier : 1.0);
  if (activeSurge > 1) {
    fare *= activeSurge;
  }

  // Ensure minimum fare
  fare = Math.max(fare, minFare);

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
