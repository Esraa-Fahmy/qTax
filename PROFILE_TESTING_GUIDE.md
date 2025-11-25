# اختبار البروفايل على Postman

## 🌐 Base URL
```
http://213.210.20.206:9000
```

---

## 🔐 تسجيل الدخول الأول

### 1. إرسال OTP
**POST** `http://213.210.20.206:9000/api/v1/auth/send-otp`
```json
{
  "phone": "+201234567890"
}
```

### 2. التحقق من OTP
**POST** `http://213.210.20.206:9000/api/v1/auth/verify-otp`
```json
{
  "phone": "+201234567890",
  "otp": "123456"
}
```
**احفظ الـ token!**

---

## 👤 اختبار البروفايل (للكل - User, Driver, Admin)

### 3. عرض البروفايل
**GET** `http://213.210.20.206:9000/api/v1/users/profile`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 4. تحديث الاسم والإيميل
**PUT** `http://213.210.20.206:9000/api/v1/users/profile`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "fullName": "أحمد محمد",
  "email": "ahmed@example.com"
}
```

---

### 5. تحديث صورة البروفايل
**PUT** `http://213.210.20.206:9000/api/v1/users/profile`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Body (form-data):**
- Key: `profileImg`
- Type: File
- Value: اختار صورة

**⚠️ مهم:** استخدم `form-data` مش `JSON`!

---

### 6. تغيير رقم التليفون
**PUT** `http://213.210.20.206:9000/api/v1/users/profile`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "phone": "+201111111111"
}
```

**النتيجة:**
```json
{
  "status": "pending_verification",
  "message": "Phone number updated. OTP sent for verification."
}
```

---

### 7. التحقق من الرقم الجديد
**POST** `http://213.210.20.206:9000/api/v1/users/profile/verify-phone`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "code": "123456"
}
```

**النتيجة:**
```json
{
  "status": "success",
  "message": "Phone verified successfully"
}
```

---

## 📍 اختبار العناوين المحفوظة (للراكب فقط)

### 8. حفظ عنوان المنزل
**POST** `http://213.210.20.206:9000/api/v1/passenger/addresses`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "label": "home",
  "address": "22 شارع الثورة، مدينة نصر",
  "latitude": 30.0444,
  "longitude": 31.2357
}
```

---

### 9. حفظ عنوان العمل
**POST** `http://213.210.20.206:9000/api/v1/passenger/addresses`

**Body (JSON):**
```json
{
  "label": "work",
  "address": "12 شارع المرغني، مصر الجديدة",
  "latitude": 30.0876,
  "longitude": 31.3421
}
```

---

### 10. عرض كل العناوين
**GET** `http://213.210.20.206:9000/api/v1/passenger/addresses`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 11. حذف عنوان
**DELETE** `http://213.210.20.206:9000/api/v1/passenger/addresses/home`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

## ✅ ملخص الـ Endpoints

### Profile (للكل - User, Driver, Admin):
| الوظيفة | Method | URL |
|---------|--------|-----|
| عرض البروفايل | GET | `/api/v1/users/profile` |
| تحديث البروفايل | PUT | `/api/v1/users/profile` |
| التحقق من الرقم | POST | `/api/v1/users/profile/verify-phone` |

### Addresses (للراكب فقط):
| الوظيفة | Method | URL |
|---------|--------|-----|
| حفظ عنوان | POST | `/api/v1/passenger/addresses` |
| عرض العناوين | GET | `/api/v1/passenger/addresses` |
| حذف عنوان | DELETE | `/api/v1/passenger/addresses/:label` |

---

## 📝 ملاحظات مهمة

1. ✅ **Profile endpoints** بتشتغل لـ User, Driver, Admin
2. ✅ **Addresses endpoints** للراكب فقط
3. ✅ **تغيير رقم التليفون بيبعت OTP تلقائي**
4. ✅ **الأدمن مش محتاج رقم تليفون (اختياري)**
5. ✅ **الصورة لازم تتبعت كـ form-data مش JSON**
6. ✅ **الراكب مش هيشوف بيانات السواق الخاصة** (earnings, isOnline, pickupRadius)
7. ✅ **السواق مش هيشوف بيانات الراكب الخاصة** (wallet, vouchers, addresses)

جاهزة للاختبار! 🚀
