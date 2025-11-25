# Passenger App Features - Implementation Summary

## ✅ What Was Implemented

### 📦 New Models Created

#### 1. Wallet Model (`models/walletModel.js`)
- User wallet with balance tracking
- Transaction history (topup, ride_payment, refund, withdrawal)
- Balance before/after for each transaction
- Linked to rides

#### 2. Voucher Model (`models/voucherModel.js`)
- Voucher code (unique, uppercase)
- Discount types: **fixed** or **percentage**
- Max discount for percentage type
- Minimum ride amount requirement
- Expiry date
- Usage limits (total and per user)
- Usage tracking with user and ride references
- Active/inactive status

#### 3. Notification Model (`models/notificationModel.js`)
- User notifications
- Types: ride, payment, system, promotion
- Read/unread status
- Additional data field for context

---

### 🔄 Models Updated

#### Ride Model (`models/rideModel.js`)
**New Fields:**
- `stops` - Array of additional destinations with coordinates and order
- `vehicleType` - economy, comfort, or premium
- `voucherCode` - Applied voucher
- `voucherDiscount` - Discount amount
- `walletAmountUsed` - Amount paid from wallet
- `finalFare` - Total after discounts
- `paymentMethod` - Added "wallet" option

#### User Model (`models/userModel.js`)
**New Fields:**
- `savedAddresses` - Array of home, work, favorite locations
- `tempPhone`, `tempPhoneOTP`, `tempPhoneOTPExpires` - For phone change verification

---

### 🎮 Controllers Created

#### 1. Wallet Controller (`controllers/walletController.js`)
- `getWallet` - Get balance and recent transactions
- `getTransactions` - Paginated transaction history
- `topUpWallet` - Add money to wallet
- `deductFromWallet` - Internal function for ride payments
- `refundToWallet` - Internal function for cancellations

#### 2. Voucher Controller (`controllers/voucherController.js`)
- `applyVoucher` - Validate and calculate discount
  - Checks expiry date
  - Checks minimum ride amount
  - Checks usage limits (total and per user)
  - Calculates discount (fixed or percentage with max cap)
- `getAvailableVouchers` - List vouchers user can still use
- `markVoucherAsUsed` - Internal function to track usage

#### 3. Notification Controller (`controllers/notificationController.js`)
- `getNotifications` - Paginated list with unread count
- `markAsRead` - Mark single notification
- `markAllAsRead` - Mark all as read
- `deleteNotification` - Delete notification
- `createNotification` - Internal function with Socket.io push

#### 4. Profile Controller (`controllers/profileController.js`)
- `getProfile` - Get user profile
- `updateProfile` - Update name, email, photo
- `requestPhoneChange` - Send OTP to new number
- `verifyPhoneChange` - Verify OTP and update phone
- `saveAddress` - Save home/work/favorite address
- `getAddresses` - Get saved addresses
- `deleteAddress` - Delete saved address

---

### 🔧 Controllers Enhanced

#### Passenger Ride Controller (`controllers/passengerRideController.js`)
**Enhanced `requestRide`:**
- Multiple stops support with distance calculation through all points
- Vehicle type selection (economy, comfort, premium)
- Voucher application with validation
- Wallet payment option
- Calculates: baseFare → voucherDiscount → walletAmountUsed → finalFare

**Enhanced `cancelRide`:**
- Refunds wallet amount if used

**New Function:**
- `shareRideInfo` - Get shareable ride details

---

### 🛣️ Routes

#### Passenger Routes (`routes/passengerRoutes.js`)
**Ride Routes:**
- POST `/api/v1/passenger/rides/request` - Request ride with stops, vehicle type, voucher
- POST `/api/v1/passenger/rides/:rideId/cancel` - Cancel with refund
- POST `/api/v1/passenger/rides/:rideId/rate` - Rate driver
- POST `/api/v1/passenger/rides/:rideId/share` - Share ride info
- GET `/api/v1/passenger/rides/active` - Get active ride
- GET `/api/v1/passenger/rides/history` - Ride history
- GET `/api/v1/passenger/drivers/nearby` - Nearby drivers

**Wallet Routes:**
- GET `/api/v1/passenger/wallet` - Balance and transactions
- GET `/api/v1/passenger/wallet/transactions` - Full transaction history
- POST `/api/v1/passenger/wallet/topup` - Top up wallet

**Voucher Routes:**
- POST `/api/v1/passenger/vouchers/apply` - Apply voucher
- GET `/api/v1/passenger/vouchers` - Available vouchers

**Notification Routes:**
- GET `/api/v1/passenger/notifications` - All notifications
- PUT `/api/v1/passenger/notifications/:id/read` - Mark as read
- PUT `/api/v1/passenger/notifications/read-all` - Mark all as read
- DELETE `/api/v1/passenger/notifications/:id` - Delete

**Profile Routes:**
- GET `/api/v1/passenger/profile` - Get profile
- PUT `/api/v1/passenger/profile` - Update profile (with image upload)
- POST `/api/v1/passenger/profile/change-phone/request` - Request phone change
- POST `/api/v1/passenger/profile/change-phone/verify` - Verify OTP

**Address Routes:**
- POST `/api/v1/passenger/addresses` - Save address
- GET `/api/v1/passenger/addresses` - Get addresses
- DELETE `/api/v1/passenger/addresses/:label` - Delete address

#### Admin Routes (`routes/adminRoutes.js`)
**Voucher Management:**
- POST `/api/v1/admin/vouchers` - Create voucher
- GET `/api/v1/admin/vouchers` - All vouchers
- PUT `/api/v1/admin/vouchers/:id` - Update voucher
- DELETE `/api/v1/admin/vouchers/:id` - Delete voucher

**Wallet Management:**
- GET `/api/v1/admin/wallets` - All wallet transactions

---

### 🧮 Utilities Updated

#### Fare Calculator (`utils/fareCalculator.js`)
**Enhanced with Vehicle Types:**
```javascript
economy: 1.0x multiplier
comfort: 1.3x multiplier
premium: 1.6x multiplier
```

**Formula:**
```
Base Fare = 10 EGP
Per KM = 5 EGP
Per Minute = 1 EGP

Fare = (10 + (distance × 5) + (duration × 1)) × vehicle_multiplier
```

---

## 💰 Pricing Examples

### Vehicle Types
- **Economy** (8.5 km, 17 min): 10 + (8.5×5) + (17×1) = 69.5 × 1.0 = **70 EGP**
- **Comfort** (8.5 km, 17 min): 69.5 × 1.3 = **90 EGP**
- **Premium** (8.5 km, 17 min): 69.5 × 1.6 = **111 EGP**

### Voucher Discounts
**Fixed Discount:**
- Code: SAVE20
- Discount: 20 EGP
- Fare: 70 EGP → **50 EGP**

**Percentage Discount:**
- Code: PERCENT10
- Discount: 10%
- Max Discount: 15 EGP
- Fare: 70 EGP → 7 EGP discount → **63 EGP**

### Wallet Payment
- Fare after voucher: 50 EGP
- Wallet balance: 30 EGP
- Wallet used: 30 EGP
- Cash needed: **20 EGP**

---

## 🔐 Phone Change Flow

1. User requests phone change with new number
2. System generates 6-digit OTP
3. OTP sent via Twilio SMS
4. User enters OTP within 10 minutes
5. Phone number updated, marked as verified
6. Temporary fields cleared

---

## 📍 Saved Addresses

Users can save up to 3 types:
- **Home** - Home address
- **Work** - Work address
- **Favorite** - Any favorite location

Each address includes:
- Label (home/work/favorite)
- Full address string
- Coordinates (latitude, longitude)

---

## 🎯 Multiple Stops Feature

**How it works:**
1. User selects pickup and dropoff
2. User adds stops in between
3. System calculates distance through all points:
   - Pickup → Stop 1 → Stop 2 → ... → Dropoff
4. Total distance and fare calculated
5. Stops stored with order (1, 2, 3...)

---

## 🎫 Voucher System Details

### Validation Checks:
1. ✅ Voucher exists and is active
2. ✅ Not expired
3. ✅ Ride amount ≥ minimum required
4. ✅ Total usage < usage limit
5. ✅ User usage < per-user limit

### Discount Calculation:
**Fixed:**
```javascript
discount = discountValue
if (discount > rideAmount) discount = rideAmount
```

**Percentage:**
```javascript
discount = (rideAmount × discountValue) / 100
if (maxDiscount && discount > maxDiscount) discount = maxDiscount
if (discount > rideAmount) discount = rideAmount
```

---

## 🔔 Notifications

### Types:
- **ride** - Ride updates (accepted, started, completed)
- **payment** - Payment confirmations, wallet top-ups
- **system** - System announcements
- **promotion** - Promotional offers, vouchers

### Delivery:
- Stored in database
- Real-time push via Socket.io
- Unread count tracking

---

## 📊 Admin Features

### Voucher Management:
- Create vouchers with all parameters
- View all vouchers with usage stats
- Update voucher details
- Delete/deactivate vouchers

### Wallet Monitoring:
- View all user wallets
- See transaction history
- Monitor top-ups and usage

---

## ❌ Excluded Features (As Requested)

- Card payment integration (postponed)
- Chat system (postponed)
- Voice/Video calls (postponed)

---

## 🧪 Testing Checklist

- [ ] Request ride with multiple stops
- [ ] Request ride with different vehicle types
- [ ] Apply fixed discount voucher
- [ ] Apply percentage discount voucher
- [ ] Top up wallet
- [ ] Pay with wallet
- [ ] Change phone number with OTP
- [ ] Save/delete addresses
- [ ] View notifications
- [ ] Admin create/manage vouchers

---

## 📱 Flutter Team Requirements

### Packages Needed:
```yaml
# Already mentioned in previous docs
socket_io_client: ^2.0.3
geolocator: ^11.0.0
firebase_messaging: ^14.7.0
google_maps_flutter: ^2.5.0
```

### New Screens:
1. **Trip Options** - Select stops, vehicle type
2. **Wallet** - Balance, top-up, transactions
3. **Vouchers** - Available vouchers, apply code
4. **Notifications** - List with unread indicator
5. **Profile Edit** - Update info, change phone
6. **Saved Addresses** - Manage home/work/favorites

---

كل حاجة اتنفذت بالكامل! 🎉
