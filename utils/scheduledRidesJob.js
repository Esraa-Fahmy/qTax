const cron = require('node-cron');
const Ride = require('../models/rideModel');
const User = require('../models/userModel');
const { isWithinRadius } = require('./distanceCalculator');

let io = null;

// Initialize the cron job with socket.io instance
const initScheduledRidesJob = (socketIo) => {
  io = socketIo;
  
  // Run every minute to check for scheduled rides
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find scheduled rides that should start now
      const scheduledRides = await Ride.find({
        isScheduled: true,
        status: 'pending',
        scheduledTime: { $lte: now }
      }).populate('passenger', 'fullName rating');
      
      if (scheduledRides.length === 0) return;
      
      console.log(`Found ${scheduledRides.length} scheduled rides to activate`);
      
      // Find online drivers
      const onlineDrivers = await User.find({
        role: 'driver',
        isOnline: true,
        status: 'active',
        'currentLocation.latitude': { $exists: true }
      });
      
      // Process each scheduled ride
      for (const ride of scheduledRides) {
        const { pickupLocation } = ride;
        
        // Filter drivers within radius
        const nearbyDrivers = onlineDrivers.filter(driver => {
          if (!driver.currentLocation) return false;
          
          return isWithinRadius(
            driver.currentLocation,
            { latitude: pickupLocation.coordinates.latitude, longitude: pickupLocation.coordinates.longitude },
            driver.pickupRadius || 10
          );
        });
        
        // Emit to nearby drivers
        if (io && nearbyDrivers.length > 0) {
          nearbyDrivers.forEach(driver => {
            io.to(`user_${driver._id}`).emit('ride:new', {
              rideId: ride._id,
              pickup: ride.pickupLocation,
              dropoff: ride.dropoffLocation,
              stops: ride.stops,
              vehicleType: ride.vehicleType,
              fare: ride.finalFare,
              distance: ride.distance,
              isScheduled: true,
              passenger: {
                id: ride.passenger._id,
                name: ride.passenger.fullName,
                rating: ride.passenger.rating
              }
            });
          });
          
          console.log(`Activated scheduled ride ${ride._id} for ${nearbyDrivers.length} drivers`);
        }
      }
    } catch (error) {
      console.error('Error in scheduled rides job:', error);
    }
  });
  
  console.log('✅ Scheduled rides cron job initialized');
};

module.exports = { initScheduledRidesJob };
