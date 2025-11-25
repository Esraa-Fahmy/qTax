# qTax API Documentation

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Driver Endpoints

### Base URL: `/api/v1/driver`

#### 1. Toggle Online/Offline Status
**PUT** `/status/toggle`
```json
Request:
{
  "isOnline": true
}

Response:
{
  "status": "success",
  "message": "You are now online",
  "data": {
    "isOnline": true
  }
}
```

#### 2. Update Location
**PUT** `/location`
```json
Request:
{
  "latitude": 30.0444,
  "longitude": 31.2357
}

Response:
{
  "status": "success",
  "message": "Location updated"
}
```

#### 3. Get Dashboard Stats
**GET** `/dashboard`
```json
Response:
{
  "status": "success",
  "data": {
    "driver": {
      "isOnline": true,
      "earnings": {
        "today": 150,
        "thisWeek": 800,
        "total": 5000
      },
      "totalRides": 120,
      "todayRides": 5,
      "rating": 4.8,
      "currentLocation": {...},
      "settings": {
        "autoAcceptRequests": false,
        "pickupRadius": 5
      }
    },
    "activeRide": {...}
  }
}
```

#### 4. Get Earnings
**GET** `/earnings`
```json
Response:
{
  "status": "success",
  "data": {
    "earnings": {
      "today": 150,
      "thisWeek": 800,
      "total": 5000
    },
    "totalRides": 120,
    "todayRides": 5,
    "weekRides": 25,
    "rating": 4.8
  }
}
```

#### 5. Update Settings
**PUT** `/settings`
```json
Request:
{
  "autoAcceptRequests": true,
  "pickupRadius": 10,
  "fcmToken": "firebase_token_here"
}

Response:
{
  "status": "success",
  "message": "Settings updated successfully",
  "data": {
    "autoAcceptRequests": true,
    "pickupRadius": 10
  }
}
```

#### 6. Get Heat Map
**GET** `/heatmap`
```json
Response:
{
  "status": "success",
  "results": 15,
  "data": [
    {
      "latitude": 30.0444,
      "longitude": 31.2357,
      "intensity": 1
    }
  ]
}
```

#### 7. Get Incoming Rides
**GET** `/rides/incoming`
```json
Response:
{
  "status": "success",
  "results": 3,
  "data": [
    {
      "_id": "ride_id",
      "passenger": {
        "fullName": "Ahmed Yasser",
        "phone": "+201234567890",
        "rating": 4.5
      },
      "pickupLocation": {...},
      "dropoffLocation": {...},
      "fare": 45,
      "distance": 8.5,
      "status": "pending"
    }
  ]
}
```

#### 8. Accept Ride
**POST** `/rides/:rideId/accept`
```json
Response:
{
  "status": "success",
  "message": "Ride accepted successfully",
  "data": {
    "_id": "ride_id",
    "status": "accepted",
    "fare": 45,
    "distance": 8.5,
    "duration": 17,
    "passenger": {...},
    "driver": {...}
  }
}
```

#### 9. Start Ride
**POST** `/rides/:rideId/start`

#### 10. Arrive at Destination
**POST** `/rides/:rideId/arrive`

#### 11. Complete Ride
**POST** `/rides/:rideId/complete`

#### 12. Cancel Ride
**POST** `/rides/:rideId/cancel`
```json
Request:
{
  "reason": "Emergency situation"
}
```

#### 13. Rate Passenger
**POST** `/rides/:rideId/rate`
```json
Request:
{
  "rating": 5,
  "review": "Great passenger!"
}
```

#### 14. Get Active Ride
**GET** `/rides/active`

#### 15. Get Ride History
**GET** `/rides/history?page=1&limit=10`

---

## Passenger Endpoints

### Base URL: `/api/v1/passenger`

#### 1. Request Ride
**POST** `/rides/request`
```json
Request:
{
  "pickupAddress": "22 Al-Thawra Street, Nasr City, Cairo",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "12 Al-Murgani Street, Heliopolis, Cairo",
  "dropoffLatitude": 30.0876,
  "dropoffLongitude": 31.3421,
  "paymentMethod": "cash"
}

Response:
{
  "status": "success",
  "message": "Ride requested successfully. Looking for nearby drivers...",
  "data": {
    "_id": "ride_id",
    "status": "pending",
    "fare": 45,
    "distance": 8.5,
    "duration": 17
  }
}
```

#### 2. Get Nearby Drivers
**GET** `/drivers/nearby?latitude=30.0444&longitude=31.2357&radius=10`
```json
Response:
{
  "status": "success",
  "results": 5,
  "data": [
    {
      "fullName": "Ahmed Yasser",
      "profileImg": "...",
      "rating": 4.8,
      "currentLocation": {
        "latitude": 30.0450,
        "longitude": 31.2360
      }
    }
  ]
}
```

#### 3. Cancel Ride
**POST** `/rides/:rideId/cancel`
```json
Request:
{
  "reason": "Changed my mind"
}
```

#### 4. Rate Driver
**POST** `/rides/:rideId/rate`
```json
Request:
{
  "rating": 5,
  "review": "Excellent driver!"
}
```

#### 5. Get Active Ride
**GET** `/rides/active`

#### 6. Get Ride History
**GET** `/rides/history?page=1&limit=10`

---

## Admin Endpoints

### Base URL: `/api/v1/admin`

#### 1. Get All Rides
**GET** `/rides?status=completed&page=1&limit=20`

#### 2. Get Ride Statistics
**GET** `/rides/stats`
```json
Response:
{
  "status": "success",
  "data": {
    "totalRides": 1500,
    "completedRides": 1200,
    "activeRides": 25,
    "cancelledRides": 275,
    "todayRides": 150,
    "totalRevenue": 75000
  }
}
```

#### 3. Get Ride by ID
**GET** `/rides/:id`

---

## Socket.io Events

### Client → Server

#### Driver Events
```javascript
// Register user
socket.emit('register', userId);

// Driver goes online
socket.emit('driver:online', driverId);

// Driver goes offline
socket.emit('driver:offline', driverId);

// Update location
socket.emit('driver:location', {
  driverId,
  latitude,
  longitude,
  rideId // optional, if in active ride
});

// Join ride room
socket.emit('join:ride', rideId);

// Leave ride room
socket.emit('leave:ride', rideId);
```

### Server → Client

#### Driver Receives
```javascript
// New ride request
socket.on('ride:new', (data) => {
  // data: { rideId, pickup, dropoff, fare, distance, passenger }
});

// Passenger cancelled
socket.on('ride:cancelled', (data) => {
  // data: { rideId, cancelledBy, reason }
});
```

#### Passenger Receives
```javascript
// Ride accepted by driver
socket.on('ride:accepted', (ride) => {
  // Full ride object with driver info
});

// Ride started
socket.on('ride:started', (ride) => {});

// Driver arrived
socket.on('ride:arrived', (ride) => {});

// Ride completed
socket.on('ride:completed', (ride) => {});

// Ride cancelled
socket.on('ride:cancelled', (data) => {
  // data: { ride, cancelledBy, reason }
});

// Driver location update
socket.on('driver:location', (location) => {
  // location: { latitude, longitude }
});
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Ride Status Flow

```
pending → accepted → started → arrived → completed
                ↓
            cancelled
```

## Payment Methods
- `cash`
- `card`

## Roles
- `user` (passenger)
- `driver`
- `admin`
