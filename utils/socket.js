// socket.js
let ioInstance;
const onlineUsers = new Map();

function initSocket(server) {
  const { Server } = require("socket.io");
  ioInstance = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  ioInstance.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("register", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`✅ Registered user ${userId} to socket ${socket.id}`);
    });

    // Driver goes online
    socket.on("driver:online", (driverId) => {
      socket.join(`driver_${driverId}`);
      console.log(`🚗 Driver ${driverId} is now online`);
    });

    // Driver goes offline
    socket.on("driver:offline", (driverId) => {
      socket.leave(`driver_${driverId}`);
      console.log(`🚗 Driver ${driverId} is now offline`);
    });

    // Driver location update
    socket.on("driver:location", (data) => {
      const { driverId, latitude, longitude, rideId } = data;
      // Broadcast to passenger if there's an active ride
      if (rideId) {
        socket.to(`ride_${rideId}`).emit("driver:location", {
          latitude,
          longitude,
        });
      }
    });

    // Join ride room (for real-time updates)
    socket.on("join:ride", (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`🚕 Joined ride room: ${rideId}`);
    });

    // Leave ride room
    socket.on("leave:ride", (rideId) => {
      socket.leave(`ride_${rideId}`);
      console.log(`🚕 Left ride room: ${rideId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      [...onlineUsers.entries()].forEach(([uid, sid]) => {
        if (sid === socket.id) onlineUsers.delete(uid);
      });
    });
  });

  return ioInstance;
}

function getIo() {
  return ioInstance;
}

function getOnlineUsers() {
  return onlineUsers;
}

module.exports = { initSocket, getIo, getOnlineUsers };
