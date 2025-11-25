const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const cors = require("cors");
const compression = require("compression");
const http = require("http");
const dbConnection = require("./config/database");
const globalError = require("./midlewares/errmiddleware");
const authRoutes = require("./routes/authRoute");
const adminRoutes = require("./routes/adminRoutes");
const driverProfileRoutes = require("./routes/driverProfile");
const driverRoutes = require("./routes/driverRoutes");
const passengerRoutes = require("./routes/passengerRoutes");
const usersRoutes = require("./routes/userRoutes");
const { initSocket } = require("./utils/socket");


dbConnection();

const app = express();

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));




//Mount
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/driver/profile", driverProfileRoutes);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/passenger", passengerRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/users", usersRoutes);




// Global Error Handler
app.use(globalError);

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io); // Make io accessible in controllers 

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
