# دليل اختبار qTax على Postman - خطوة بخطوة

## 🚀 الإعداد الأولي

### 1. السيرفر
**السيرفر شغال على:** `http://213.210.20.206:9000`

**ملحوظة:** السيرفر ده على الإنترنت، مش محتاجة تشغلي حاجة محلياً!

---

## 📋 الخطوات بالترتيب

### المرحلة 1️⃣: تسجيل الدخول (Authentication)

#### خطوة 1: إرسال OTP للراكب
**POST** `http://localhost:8000/api/v1/auth/send-otp`

**Body (JSON):**
```json
{
  "phone": "+201234567890"
}
```

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "message": "OTP sent successfully"
}
```

**ملحوظة:** هتلاقي الـ OTP في الـ console بتاع السيرفر (لو Twilio مش متفعل)

---

#### خطوة 2: التحقق من OTP
**POST** `http://localhost:8000/api/v1/auth/verify-otp`

**Body (JSON):**
```json
{
  "phone": "+201234567890",
  "otp": "123456"
}
```

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "message": "Phone verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "...",
    "phone": "+201234567890",
    "role": "user"
  }
}
```

**⚠️ مهم جداً:** احفظ الـ `token` ده! هتستخدمه في كل الطلبات الجاية.

---

### المرحلة 2️⃣: إعداد الـ Authorization في Postman

**في كل request جاي:**
1. اذهب لـ **Authorization** tab
2. اختار **Type**: Bearer Token
3. الصق الـ token اللي حفظته

**أو:**
1. اذهب لـ **Headers** tab
2. أضف header جديد:
   - **Key**: `Authorization`
   - **Value**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### المرحلة 4️⃣: حفظ العناوين

#### خطوة 5: حفظ عنوان المنزل
**POST** `http://localhost:8000/api/v1/passenger/addresses`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Body (JSON):**
```json
{
  "label": "home",
  "address": "22 شارع الثورة، مدينة نصر، القاهرة",
  "latitude": 30.0444,
  "longitude": 31.2357
}
```

---

#### خطوة 6: حفظ عنوان العمل
**POST** `http://localhost:8000/api/v1/passenger/addresses`

**Body (JSON):**
```json
{
  "label": "work",
  "address": "12 شارع المرغني، مصر الجديدة، القاهرة",
  "latitude": 30.0876,
  "longitude": 31.3421
}
```

---

#### خطوة 7: عرض العناوين المحفوظة
**GET** `http://localhost:8000/api/v1/passenger/addresses`

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "results": 2,
  "data": [
    {
      "label": "home",
      "address": "22 شارع الثورة، مدينة نصر، القاهرة",
      "coordinates": {
        "latitude": 30.0444,
        "longitude": 31.2357
      }
    },
    {
      "label": "work",
      "address": "12 شارع المرغني، مصر الجديدة، القاهرة",
      "coordinates": {
        "latitude": 30.0876,
        "longitude": 31.3421
      }
    }
  ]
}
```

---

### المرحلة 5️⃣: المحفظة (Wallet)

#### خطوة 8: عرض رصيد المحفظة
**GET** `http://localhost:8000/api/v1/passenger/wallet`

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "data": {
    "balance": 0,
    "transactions": []
  }
}
```

---

#### خطوة 9: تعبئة المحفظة
**POST** `http://localhost:8000/api/v1/passenger/wallet/topup`

**Body (JSON):**
```json
{
  "amount": 100
}
```

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "message": "Wallet topped up successfully",
  "data": {
    "balance": 100,
    "transaction": {
      "type": "topup",
      "amount": 100,
      "description": "Wallet top-up of 100 EGP",
      "balanceBefore": 0,
      "balanceAfter": 100
    }
  }
}
```

---

#### خطوة 10: عرض سجل المعاملات
**GET** `http://localhost:8000/api/v1/passenger/wallet/transactions`

---

### المرحلة 6️⃣: الكوبونات (Vouchers) - Admin

**⚠️ ملحوظة:** لازم تسجل دخول كـ Admin الأول!

#### خطوة 11: تسجيل دخول Admin
**POST** `http://localhost:8000/api/v1/auth/admin-login`

**Body (JSON):**
```json
{
  "email": "admin@qtax.com",
  "password": "your_admin_password"
}
```

**احفظ الـ token الجديد للـ Admin!**

---

#### خطوة 12: إنشاء كوبون خصم ثابت
**POST** `http://localhost:8000/api/v1/admin/vouchers`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
```

**Body (JSON):**
```json
{
  "code": "SAVE20",
  "discountType": "fixed",
  "discountValue": 20,
  "minRideAmount": 30,
  "expiryDate": "2025-12-31",
  "usageLimit": 100,
  "usagePerUser": 1,
  "description": "خصم 20 جنيه على أي رحلة"
}
```

---

#### خطوة 13: إنشاء كوبون خصم نسبة مئوية
**POST** `http://localhost:8000/api/v1/admin/vouchers`

**Body (JSON):**
```json
{
  "code": "PERCENT10",
  "discountType": "percentage",
  "discountValue": 10,
  "maxDiscount": 15,
  "minRideAmount": 50,
  "expiryDate": "2025-12-31",
  "usageLimit": 50,
  "usagePerUser": 2,
  "description": "خصم 10% بحد أقصى 15 جنيه"
}
```

---

#### خطوة 14: عرض كل الكوبونات (Admin)
**GET** `http://localhost:8000/api/v1/admin/vouchers`

---

### المرحلة 7️⃣: اختبار الكوبونات (Passenger)

**ارجع للـ Passenger token!**

#### خطوة 15: عرض الكوبونات المتاحة
**GET** `http://localhost:8000/api/v1/passenger/vouchers`

**Headers:**
```
Authorization: Bearer PASSENGER_TOKEN
```

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "results": 2,
  "data": [
    {
      "code": "SAVE20",
      "discountType": "fixed",
      "discountValue": 20,
      "description": "خصم 20 جنيه على أي رحلة"
    },
    {
      "code": "PERCENT10",
      "discountType": "percentage",
      "discountValue": 10,
      "maxDiscount": 15,
      "description": "خصم 10% بحد أقصى 15 جنيه"
    }
  ]
}
```

---

#### خطوة 16: تطبيق كوبون
**POST** `http://localhost:8000/api/v1/passenger/vouchers/apply`

**Body (JSON):**
```json
{
  "code": "SAVE20",
  "rideAmount": 70
}
```

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "message": "Voucher applied successfully",
  "data": {
    "code": "SAVE20",
    "discountType": "fixed",
    "discountValue": 20,
    "discount": 20,
    "originalAmount": 70,
    "finalAmount": 50
  }
}
```

---

### المرحلة 8️⃣: طلب رحلة (Request Ride)

#### خطوة 17: طلب رحلة عادية (Economy)
**POST** `http://localhost:8000/api/v1/passenger/rides/request`

**Headers:**
```
Authorization: Bearer PASSENGER_TOKEN
```

**Body (JSON):**
```json
{
  "pickupAddress": "22 شارع الثورة، مدينة نصر",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "12 شارع المرغني، مصر الجديدة",
  "dropoffLatitude": 30.0876,
  "dropoffLongitude": 31.3421,
  "vehicleType": "economy",
  "paymentMethod": "cash"
}
```

**النتيجة المتوقعة:**
```json
{
  "status": "success",
  "message": "Ride requested successfully. Looking for nearby drivers...",
  "data": {
    "ride": {
      "_id": "...",
      "status": "pending",
      "vehicleType": "economy",
      "distance": 8.5,
      "duration": 17,
      "fare": 69.5
    },
    "pricing": {
      "baseFare": 69.5,
      "voucherDiscount": 0,
      "walletAmountUsed": 0,
      "finalFare": 69.5
    }
  }
}
```

---

#### خطوة 18: طلب رحلة Comfort
**POST** `http://localhost:8000/api/v1/passenger/rides/request`

**Body (JSON):**
```json
{
  "pickupAddress": "22 شارع الثورة، مدينة نصر",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "12 شارع المرغني، مصر الجديدة",
  "dropoffLatitude": 30.0876,
  "dropoffLongitude": 31.3421,
  "vehicleType": "comfort",
  "paymentMethod": "cash"
}
```

**السعر المتوقع:** حوالي 90 جنيه (1.3x)

---

#### خطوة 19: طلب رحلة Premium
**Body (JSON):**
```json
{
  "pickupAddress": "22 شارع الثورة، مدينة نصر",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "12 شارع المرغني، مصر الجديدة",
  "dropoffLatitude": 30.0876,
  "dropoffLongitude": 31.3421,
  "vehicleType": "premium",
  "paymentMethod": "cash"
}
```

**السعر المتوقع:** حوالي 111 جنيه (1.6x)

---

#### خطوة 20: طلب رحلة مع نقاط توقف
**POST** `http://localhost:8000/api/v1/passenger/rides/request`

**Body (JSON):**
```json
{
  "pickupAddress": "مدينة نصر",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "المعادي",
  "dropoffLatitude": 29.9602,
  "dropoffLongitude": 31.2569,
  "stops": [
    {
      "address": "وسط البلد",
      "latitude": 30.0444,
      "longitude": 31.2357
    },
    {
      "address": "الزمالك",
      "latitude": 30.0626,
      "longitude": 31.2197
    }
  ],
  "vehicleType": "economy",
  "paymentMethod": "cash"
}
```

**النتيجة:** السعر هيكون أعلى بسبب المسافة الإضافية

---

#### خطوة 21: طلب رحلة مع كوبون
**POST** `http://localhost:8000/api/v1/passenger/rides/request`

**Body (JSON):**
```json
{
  "pickupAddress": "مدينة نصر",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "مصر الجديدة",
  "dropoffLatitude": 30.0876,
  "dropoffLongitude": 31.3421,
  "vehicleType": "economy",
  "paymentMethod": "cash",
  "voucherCode": "SAVE20"
}
```

**النتيجة المتوقعة:**
```json
{
  "pricing": {
    "baseFare": 69.5,
    "voucherDiscount": 20,
    "walletAmountUsed": 0,
    "finalFare": 49.5
  }
}
```

---

#### خطوة 22: طلب رحلة مع دفع من المحفظة
**POST** `http://localhost:8000/api/v1/passenger/rides/request`

**Body (JSON):**
```json
{
  "pickupAddress": "مدينة نصر",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "مصر الجديدة",
  "dropoffLatitude": 30.0876,
  "dropoffLongitude": 31.3421,
  "vehicleType": "economy",
  "paymentMethod": "wallet",
  "useWallet": true
}
```

**النتيجة:** هيخصم من رصيد المحفظة (100 جنيه)

---

#### خطوة 23: طلب رحلة مع كوبون + محفظة
**POST** `http://localhost:8000/api/v1/passenger/rides/request`

**Body (JSON):**
```json
{
  "pickupAddress": "مدينة نصر",
  "pickupLatitude": 30.0444,
  "pickupLongitude": 31.2357,
  "dropoffAddress": "مصر الجديدة",
  "dropoffLatitude": 30.0876,
  "dropoffLongitude": 31.3421,
  "vehicleType": "economy",
  "paymentMethod": "wallet",
  "voucherCode": "SAVE20",
  "useWallet": true
}
```

**الحساب:**
- السعر الأساسي: 69.5 جنيه
- بعد الكوبون: 49.5 جنيه
- من المحفظة: 49.5 جنيه
- المتبقي نقداً: 0 جنيه

---

### المرحلة 9️⃣: عرض الرحلة النشطة

#### خطوة 24: عرض الرحلة النشطة
**GET** `http://localhost:8000/api/v1/passenger/rides/active`

**Headers:**
```

1. ✅ تسجيل دخول الراكب
2. ✅ تحديث البروفايل
3. ✅ حفظ عنوان المنزل والعمل
4. ✅ تعبئة المحفظة بـ 100 جنيه
5. ✅ عرض الكوبونات المتاحة
6. ✅ طلب رحلة Economy مع كوبون SAVE20 ودفع من المحفظة
7. ✅ عرض الرحلة النشطة
8. ✅ إلغاء الرحلة (اختبار الاسترجاع)
9. ✅ التحقق من رصيد المحفظة (يجب أن يكون 100 مرة أخرى)

---

## 📊 جدول الأسعار المتوقعة

| نوع السيارة | المسافة | السعر الأساسي | مع SAVE20 | مع PERCENT10 |
|-------------|---------|---------------|-----------|--------------|
| Economy     | 8.5 km  | 70 EGP        | 50 EGP    | 63 EGP       |
| Comfort     | 8.5 km  | 90 EGP        | 70 EGP    | 81 EGP       |
| Premium     | 8.5 km  | 111 EGP       | 91 EGP    | 100 EGP      |

---

## ⚠️ نصائح مهمة

1. **احفظ الـ tokens**: كل مرة تسجل دخول، احفظ الـ token في مكان آمن
2. **استخدم Postman Collections**: اعمل collection لكل الـ requests عشان تسهل عليكي
3. **Environment Variables**: استخدم متغيرات البيئة للـ base URL والـ tokens
4. **تحقق من الـ Console**: لو في مشكلة، شوف الـ console بتاع السيرفر
5. **Database**: استخدم MongoDB Compass عشان تشوف البيانات في قاعدة البيانات

---

## 🔧 إعداد Postman Collection

### متغيرات البيئة (Environment Variables):
```
base_url: http://localhost:8000
passenger_token: (هيتحدث بعد تسجيل الدخول)
admin_token: (هيتحدث بعد تسجيل دخول الأدمن)
ride_id: (هيتحدث بعد طلب رحلة)
```

### استخدام المتغيرات:
```
URL: {{base_url}}/api/v1/passenger/profile
Authorization: Bearer {{passenger_token}}
```

---

جاهزة للاختبار! 🚀
