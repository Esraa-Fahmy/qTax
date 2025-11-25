# Backend & Flutter Packages Guide

## 🔧 Backend (Node.js) - الباكدجات الموجودة

### Already Installed ✅
كل الباكدجات دي موجودة عندك بالفعل في `package.json`:

```json
{
  "bcryptjs": "^3.0.3",           // تشفير كلمات المرور
  "cloudinary": "^2.8.0",         // رفع الصور (optional)
  "compression": "^1.8.1",        // ضغط الـ responses
  "cors": "^2.8.5",               // السماح بالـ cross-origin requests
  "dotenv": "^17.2.3",            // قراءة متغيرات البيئة
  "express": "^5.1.0",            // الـ framework الأساسي
  "express-async-handler": "^1.2.0", // معالجة الـ async errors
  "firebase-admin": "^13.5.0",    // Firebase للإشعارات
  "geolib": "^3.3.4",             // حسابات الموقع
  "jsonwebtoken": "^9.0.2",       // JWT tokens
  "mongoose": "^8.19.1",          // MongoDB
  "morgan": "^1.10.1",            // HTTP request logger
  "multer": "^2.0.2",             // رفع الملفات
  "nodemon": "^3.1.10",           // Auto-restart السيرفر
  "sharp": "^0.34.5",             // معالجة الصور
  "socket.io": "^4.8.1",          // Real-time communication ✅
  "twilio": "^5.10.4"             // OTP SMS
}
```

### ✅ كل حاجة جاهزة!
**مش محتاج تنزل أي حاجة جديدة** - كل الباكدجات اللي استخدمتها موجودة عندك.

---

## 📱 Flutter Team - الباكدجات المطلوبة

### Required Packages

#### 1. Socket.io Client (للتحديثات الفورية)
```yaml
dependencies:
  socket_io_client: ^2.0.3
```

**الاستخدام:**
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

IO.Socket socket = IO.io('http://your-server:9000', <String, dynamic>{
  'transports': ['websocket'],
  'autoConnect': false,
});

socket.connect();

// Register user
socket.emit('register', userId);

// Listen for new rides (Driver)
socket.on('ride:new', (data) {
  print('New ride request: $data');
});

// Listen for ride accepted (Passenger)
socket.on('ride:accepted', (data) {
  print('Driver accepted: $data');
});

// Send location update (Driver)
socket.emit('driver:location', {
  'driverId': driverId,
  'latitude': 30.0444,
  'longitude': 31.2357,
  'rideId': rideId
});
```

---

#### 2. Location Tracking (تتبع الموقع)
```yaml
dependencies:
  geolocator: ^11.0.0
  permission_handler: ^11.0.0
```

**الاستخدام:**
```dart
import 'package:geolocator/geolocator.dart';

// Get current location
Position position = await Geolocator.getCurrentPosition(
  desiredAccuracy: LocationAccuracy.high
);

// Listen to location updates (every 5-10 seconds)
StreamSubscription<Position> positionStream = 
  Geolocator.getPositionStream(
    locationSettings: LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // meters
    )
  ).listen((Position position) {
    // Send to backend
    socket.emit('driver:location', {
      'latitude': position.latitude,
      'longitude': position.longitude,
    });
  });
```

---

#### 3. Firebase Cloud Messaging (الإشعارات)
```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
```

**الاستخدام:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

// Initialize
await Firebase.initializeApp();

// Get FCM token
String? token = await FirebaseMessaging.instance.getToken();

// Send token to backend
await http.put(
  Uri.parse('$baseUrl/api/v1/driver/settings'),
  headers: {'Authorization': 'Bearer $jwtToken'},
  body: jsonEncode({'fcmToken': token}),
);

// Listen for notifications
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Notification: ${message.notification?.title}');
});
```

---

#### 4. Google Maps (الخرائط)
```yaml
dependencies:
  google_maps_flutter: ^2.5.0
  flutter_polyline_points: ^2.0.0
```

**الاستخدام:**
```dart
import 'package:google_maps_flutter/google_maps_flutter.dart';

GoogleMap(
  initialCameraPosition: CameraPosition(
    target: LatLng(30.0444, 31.2357),
    zoom: 14,
  ),
  markers: {
    Marker(
      markerId: MarkerId('driver'),
      position: LatLng(driverLat, driverLng),
    ),
  },
  polylines: {
    Polyline(
      polylineId: PolylineId('route'),
      points: routePoints,
      color: Colors.blue,
      width: 5,
    ),
  },
)
```

---

#### 5. HTTP Requests
```yaml
dependencies:
  http: ^1.1.0
  # OR
  dio: ^5.4.0  # (أفضل للمشاريع الكبيرة)
```

**الاستخدام:**
```dart
import 'package:http/http.dart' as http;

// Request ride
final response = await http.post(
  Uri.parse('$baseUrl/api/v1/passenger/rides/request'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'pickupAddress': '...',
    'pickupLatitude': 30.0444,
    'pickupLongitude': 31.2357,
    'dropoffAddress': '...',
    'dropoffLatitude': 30.0876,
    'dropoffLongitude': 31.3421,
  }),
);
```

---

#### 6. State Management (اختياري)
```yaml
dependencies:
  # اختار واحد:
  provider: ^6.1.0
  # OR
  riverpod: ^2.4.0
  # OR
  bloc: ^8.1.0
```

---

#### 7. Background Services (للـ location tracking في الخلفية)
```yaml
dependencies:
  flutter_background_service: ^5.0.0
  # OR
  workmanager: ^0.5.0
```

**الاستخدام:**
```dart
import 'package:flutter_background_service/flutter_background_service.dart';

// Start background service
final service = FlutterBackgroundService();
await service.startService();

// في الـ background service
void onStart(ServiceInstance service) async {
  Timer.periodic(Duration(seconds: 10), (timer) async {
    Position position = await Geolocator.getCurrentPosition();
    // Send to backend
  });
}
```

---

## 📦 Complete pubspec.yaml for Flutter

```yaml
name: qtax_driver_app
description: qTax Driver & Passenger App

dependencies:
  flutter:
    sdk: flutter
  
  # Core
  http: ^1.1.0
  
  # Real-time
  socket_io_client: ^2.0.3
  
  # Location
  geolocator: ^11.0.0
  permission_handler: ^11.0.0
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  
  # Maps
  google_maps_flutter: ^2.5.0
  flutter_polyline_points: ^2.0.0
  
  # Background
  flutter_background_service: ^5.0.0
  
  # State Management (اختار واحد)
  provider: ^6.1.0
  
  # UI
  flutter_svg: ^2.0.0
  cached_network_image: ^3.3.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

---

## 🔥 Firebase Setup (مهم جداً!)

### 1. Create Firebase Project
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد
3. أضف تطبيق Android و iOS

### 2. Download Config Files
- **Android**: `google-services.json` → `android/app/`
- **iOS**: `GoogleService-Info.plist` → `ios/Runner/`

### 3. Backend Firebase Admin
عندك بالفعل `firebase-admin` في الـ backend.

**إنشاء Service Account:**
1. Firebase Console → Project Settings → Service Accounts
2. Generate New Private Key
3. حفظ الملف في `e:\Taxi\config\firebase-service-account.json`

**في الكود:**
```javascript
// utils/notifications.js
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.sendNotification = async (fcmToken, title, body, data) => {
  const message = {
    notification: { title, body },
    data,
    token: fcmToken,
  };

  try {
    await admin.messaging().send(message);
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
```

---

## ⚙️ Installation Commands

### Backend (عندك - مش محتاج حاجة)
```bash
# Already installed!
npm install
```

### Flutter Team
```bash
# Install all packages
flutter pub get

# For Firebase
flutterfire configure
```

---

## 🧪 Testing Checklist

### Backend
- [x] All packages installed
- [ ] Test Socket.io connection
- [ ] Test Firebase notifications

### Flutter
- [ ] Install all packages
- [ ] Setup Firebase
- [ ] Test Socket.io connection
- [ ] Test location tracking
- [ ] Test Google Maps
- [ ] Test notifications

---

## 📞 Important Notes

### للـ Flutter Team:

1. **Socket.io**: لازم يكون متصل طول الوقت للتحديثات الفورية
2. **Location**: لازم permission من المستخدم + background tracking
3. **Firebase**: لازم setup صح للإشعارات
4. **Google Maps**: محتاج API Key من Google Cloud Console

### API Keys Needed:
- Google Maps API Key
- Firebase Config Files
- Twilio (موجود عندك بالفعل)

---

كل حاجة واضحة؟ 🚀
