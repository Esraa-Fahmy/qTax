/**
 * Localization utility for bilingual responses (Arabic & English)
 * Usage: const { t } = require('./utils/localization');
 *        res.json({ message: t('ride.accepted') });
 */

const translations = {
  // Common messages
  'common.success': {
    en: 'Success',
    ar: 'نجح'
  },
  'common.error': {
    en: 'Error',
    ar: 'خطأ'
  },
  'common.notFound': {
    en: 'Not found',
    ar: 'غير موجود'
  },
  'common.unauthorized': {
    en: 'Unauthorized',
    ar: 'غير مصرح'
  },
  'common.forbidden': {
    en: 'Forbidden',
    ar: 'محظور'
  },
  'common.invalidData': {
    en: 'Invalid data',
    ar: 'بيانات غير صالحة'
  },

  // Ride messages
  'ride.requested': {
    en: 'Ride requested successfully',
    ar: 'تم طلب الرحلة بنجاح'
  },
  'ride.accepted': {
    en: 'Ride accepted successfully',
    ar: 'تم قبول الرحلة بنجاح'
  },
  'ride.cancelled': {
    en: 'Ride cancelled successfully',
    ar: 'تم إلغاء الرحلة بنجاح'
  },
  'ride.completed': {
    en: 'Ride completed successfully',
    ar: 'تم إكمال الرحلة بنجاح'
  },
  'ride.notFound': {
    en: 'Ride not found',
    ar: 'الرحلة غير موجودة'
  },
  'ride.alreadyActive': {
    en: 'You already have an active ride',
    ar: 'لديك رحلة نشطة بالفعل'
  },
  'ride.noLongerAvailable': {
    en: 'This ride is no longer available',
    ar: 'هذه الرحلة لم تعد متاحة'
  },
  'ride.cannotCancel': {
    en: 'Cannot cancel this ride',
    ar: 'لا يمكن إلغاء هذه الرحلة'
  },
  'ride.arrivalConfirmed': {
    en: 'Arrival confirmed',
    ar: 'تم تأكيد الوصول'
  },
  'ride.started': {
    en: 'Ride started',
    ar: 'بدأت الرحلة'
  },

  // Driver messages
  'driver.mustBeOnline': {
    en: 'You must be online to receive ride requests',
    ar: 'يجب أن تكون متصلاً لاستقبال طلبات الرحلات'
  },
  'driver.updateLocationFirst': {
    en: 'Please update your location first',
    ar: 'الرجاء تحديث موقعك أولاً'
  },
  'driver.completeProfile': {
    en: 'Please complete your profile (name, email, photo) before accepting rides',
    ar: 'الرجاء إكمال ملفك الشخصي (الاسم، البريد الإلكتروني، الصورة) قبل قبول الرحلات'
  },
  'driver.notAssigned': {
    en: 'You are not assigned to this ride',
    ar: 'أنت غير مكلف بهذه الرحلة'
  },
  'driver.penaltyApplied': {
    en: 'Ride cancelled. 1000 IQD penalty applied (3rd cancellation today)',
    ar: 'تم إلغاء الرحلة. تم تطبيق غرامة 1000 دينار عراقي (الإلغاء الثالث اليوم)'
  },

  // Location messages
  'location.available': {
    en: 'Qtax is available in your location',
    ar: 'تطبيق Qtax متاح في موقعك'
  },
  'location.notAvailable': {
    en: 'Qtax is not available here',
    ar: 'تطبيق Qtax غير متاح في هذا الموقع'
  },
  'location.updated': {
    en: 'Location updated',
    ar: 'تم تحديث الموقع'
  },
  'location.required': {
    en: 'Latitude and longitude are required',
    ar: 'خط العرض وخط الطول مطلوبان'
  },

  // Notification messages
  'notification.markedAsRead': {
    en: 'Notification marked as read',
    ar: 'تم تحديد الإشعار كمقروء'
  },
  'notification.allMarkedAsRead': {
    en: 'All notifications marked as read',
    ar: 'تم تحديد جميع الإشعارات كمقروءة'
  },
  'notification.deleted': {
    en: 'Notification deleted',
    ar: 'تم حذف الإشعار'
  },
  'notification.notFound': {
    en: 'Notification not found',
    ar: 'الإشعار غير موجود'
  },

  // Vehicle Type messages
  'vehicleType.created': {
    en: 'Vehicle type created successfully',
    ar: 'تم إنشاء نوع المركبة بنجاح'
  },
  'vehicleType.updated': {
    en: 'Vehicle type updated successfully',
    ar: 'تم تحديث نوع المركبة بنجاح'
  },
  'vehicleType.deleted': {
    en: 'Vehicle type deleted successfully',
    ar: 'تم حذف نوع المركبة بنجاح'
  },
  'vehicleType.activated': {
    en: 'Vehicle type activated successfully',
    ar: 'تم تفعيل نوع المركبة بنجاح'
  },
  'vehicleType.deactivated': {
    en: 'Vehicle type deactivated successfully',
    ar: 'تم تعطيل نوع المركبة بنجاح'
  },
  'vehicleType.notFound': {
    en: 'Vehicle type not found',
    ar: 'نوع المركبة غير موجود'
  },
  'vehicleType.noAvailable': {
    en: 'No vehicle types available',
    ar: 'لا توجد أنواع مركبات متاحة'
  },

  // Cancellation Reason messages
  'cancellationReason.created': {
    en: 'Cancellation reason created successfully',
    ar: 'تم إنشاء سبب الإلغاء بنجاح'
  },
  'cancellationReason.updated': {
    en: 'Cancellation reason updated successfully',
    ar: 'تم تحديث سبب الإلغاء بنجاح'
  },
  'cancellationReason.deleted': {
    en: 'Cancellation reason deleted successfully',
    ar: 'تم حذف سبب الإلغاء بنجاح'
  },
  'cancellationReason.reordered': {
    en: 'Cancellation reasons reordered successfully',
    ar: 'تم إعادة ترتيب أسباب الإلغاء بنجاح'
  },
  'cancellationReason.required': {
    en: 'Cancellation reason is required',
    ar: 'سبب الإلغاء مطلوب'
  },
  'cancellationReason.invalid': {
    en: 'Invalid cancellation reason',
    ar: 'سبب الإلغاء غير صالح'
  },
  'cancellationReason.notFound': {
    en: 'Cancellation reason not found',
    ar: 'سبب الإلغاء غير موجود'
  },

  // Validation messages
  'validation.distanceDurationRequired': {
    en: 'Distance and duration are required',
    ar: 'المسافة والمدة مطلوبان'
  },
  'validation.invalidFormat': {
    en: 'Invalid request format',
    ar: 'تنسيق الطلب غير صالح'
  },
  'validation.provideIds': {
    en: 'Please provide notification IDs or set markAll to true',
    ar: 'الرجاء تقديم معرفات الإشعارات أو تعيين markAll إلى true'
  },

  // Auth messages
  'auth.loginSuccess': {
    en: 'Login successful',
    ar: 'تم تسجيل الدخول بنجاح'
  },
  'auth.registerSuccess': {
    en: 'Registration successful',
    ar: 'تم التسجيل بنجاح'
  },
  'auth.invalidCredentials': {
    en: 'Invalid credentials',
    ar: 'بيانات الاعتماد غير صحيحة'
  },
  'auth.phoneVerified': {
    en: 'Phone verified successfully',
    ar: 'تم التحقق من الهاتف بنجاح'
  },
  'auth.otpSent': {
    en: 'OTP sent successfully',
    ar: 'تم إرسال رمز التحقق بنجاح'
  },

  // Wallet messages
  'wallet.topUpSuccess': {
    en: 'Wallet topped up successfully',
    ar: 'تم شحن المحفظة بنجاح'
  },
  'wallet.insufficientBalance': {
    en: 'Insufficient wallet balance',
    ar: 'رصيد المحفظة غير كافٍ'
  },
  'wallet.transactionSuccess': {
    en: 'Transaction completed successfully',
    ar: 'تمت العملية بنجاح'
  },

  // Voucher messages
  'voucher.applied': {
    en: 'Voucher applied successfully',
    ar: 'تم تطبيق القسيمة بنجاح'
  },
  'voucher.invalid': {
    en: 'Invalid or expired voucher',
    ar: 'قسيمة غير صالحة أو منتهية الصلاحية'
  },
  'voucher.alreadyUsed': {
    en: 'Voucher already used',
    ar: 'تم استخدام القسيمة بالفعل'
  },
  'voucher.created': {
    en: 'Voucher created successfully',
    ar: 'تم إنشاء القسيمة بنجاح'
  },
  'voucher.updated': {
    en: 'Voucher updated successfully',
    ar: 'تم تحديث القسيمة بنجاح'
  },
  'voucher.deleted': {
    en: 'Voucher deleted successfully',
    ar: 'تم حذف القسيمة بنجاح'
  },

  // Profile messages
  'profile.updated': {
    en: 'Profile updated successfully',
    ar: 'تم تحديث الملف الشخصي بنجاح'
  },
  'profile.photoUploaded': {
    en: 'Photo uploaded successfully',
    ar: 'تم رفع الصورة بنجاح'
  },
  'profile.changeRequested': {
    en: 'Profile change request submitted successfully',
    ar: 'تم تقديم طلب تغيير الملف الشخصي بنجاح'
  },

  // Driver Profile messages
  'driverProfile.submitted': {
    en: 'Documents submitted for review',
    ar: 'تم تقديم المستندات للمراجعة'
  },
  'driverProfile.approved': {
    en: 'Driver profile approved',
    ar: 'تم الموافقة على ملف السائق'
  },
  'driverProfile.rejected': {
    en: 'Driver profile rejected',
    ar: 'تم رفض ملف السائق'
  },
  'driverProfile.documentUploaded': {
    en: 'Document uploaded successfully',
    ar: 'تم رفع المستند بنجاح'
  },

  // City messages
  'city.created': {
    en: 'City created successfully',
    ar: 'تم إنشاء المدينة بنجاح'
  },
  'city.updated': {
    en: 'City updated successfully',
    ar: 'تم تحديث المدينة بنجاح'
  },
  'city.deleted': {
    en: 'City deleted successfully',
    ar: 'تم حذف المدينة بنجاح'
  },
  'city.statusToggled': {
    en: 'City status updated successfully',
    ar: 'تم تحديث حالة المدينة بنجاح'
  },
  'city.notFound': {
    en: 'City not found',
    ar: 'المدينة غير موجودة'
  },

  // Settings messages
  'settings.updated': {
    en: 'Settings updated successfully',
    ar: 'تم تحديث الإعدادات بنجاح'
  },
  'settings.created': {
    en: 'Settings created successfully',
    ar: 'تم إنشاء الإعدادات بنجاح'
  },
  'settings.notConfigured': {
    en: 'Settings not configured',
    ar: 'الإعدادات غير مهيأة'
  },

  // Complaint messages
  'complaint.created': {
    en: 'Complaint submitted successfully',
    ar: 'تم تقديم الشكوى بنجاح'
  },
  'complaint.updated': {
    en: 'Complaint updated successfully',
    ar: 'تم تحديث الشكوى بنجاح'
  },
  'complaint.replied': {
    en: 'Reply sent successfully',
    ar: 'تم إرسال الرد بنجاح'
  },

  // Saved Ride messages
  'savedRide.created': {
    en: 'Ride saved successfully',
    ar: 'تم حفظ الرحلة بنجاح'
  },
  'savedRide.updated': {
    en: 'Saved ride updated successfully',
    ar: 'تم تحديث الرحلة المحفوظة بنجاح'
  },
  'savedRide.deleted': {
    en: 'Saved ride deleted successfully',
    ar: 'تم حذف الرحلة المحفوظة بنجاح'
  },
  'savedRide.notFound': {
    en: 'Saved ride not found',
    ar: 'الرحلة المحفوظة غير موجودة'
  },

  // Address messages
  'address.saved': {
    en: 'Address saved successfully',
    ar: 'تم حفظ العنوان بنجاح'
  },
  'address.updated': {
    en: 'Address updated successfully',
    ar: 'تم تحديث العنوان بنجاح'
  },
  'address.deleted': {
    en: 'Address deleted successfully',
    ar: 'تم حذف العنوان بنجاح'
  },
  'address.notFound': {
    en: 'Address not found',
    ar: 'العنوان غير موجود'
  },

  // Rating messages
  'rating.submitted': {
    en: 'Rating submitted successfully',
    ar: 'تم تقديم التقييم بنجاح'
  },
  'rating.alreadyRated': {
    en: 'You have already rated this ride',
    ar: 'لقد قمت بتقييم هذه الرحلة بالفعل'
  },
  'rating.invalidRange': {
    en: 'Rating must be between 1 and 5',
    ar: 'يجب أن يكون التقييم بين 1 و 5'
  },

  // Admin messages
  'admin.userDeleted': {
    en: 'User deleted successfully',
    ar: 'تم حذف المستخدم بنجاح'
  },
  'admin.userApproved': {
    en: 'User approved successfully',
    ar: 'تمت الموافقة على المستخدم بنجاح'
  },
  'admin.userRejected': {
    en: 'User rejected successfully',
    ar: 'تم رفض المستخدم بنجاح'
  },
  'admin.rewardsDistributed': {
    en: 'Rewards distributed successfully',
    ar: 'تم توزيع المكافآت بنجاح'
  },

  // Status messages
  'status.online': {
    en: 'You are now online',
    ar: 'أنت الآن متصل'
  },
  'status.offline': {
    en: 'You are now offline',
    ar: 'أنت الآن غير متصل'
  },

  // General action messages
  'action.requestAgain': {
    en: 'Ride requested again successfully',
    ar: 'تم طلب الرحلة مرة أخرى بنجاح'
  },
  'action.shareReady': {
    en: 'Ride info ready to share',
    ar: 'معلومات الرحلة جاهزة للمشاركة'
  },
  'action.lookingForDrivers': {
    en: 'Looking for nearby drivers...',
    ar: 'البحث عن سائقين قريبين...'
  },
};

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'ride.accepted')
 * @param {object} params - Optional parameters for string interpolation
 * @returns {object} Object with 'en' and 'ar' properties
 */
const t = (key, params = {}) => {
  const translation = translations[key];
  
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return {
      en: key,
      ar: key
    };
  }

  // Simple parameter replacement
  let en = translation.en;
  let ar = translation.ar;

  Object.keys(params).forEach(param => {
    en = en.replace(`{${param}}`, params[param]);
    ar = ar.replace(`{${param}}`, params[param]);
  });

  return { en, ar };
};

/**
 * Create a bilingual response object
 * @param {string} status - Response status ('success' or 'error')
 * @param {string} messageKey - Translation key for the message
 * @param {object} data - Response data
 * @param {object} params - Optional parameters for message interpolation
 * @returns {object} Bilingual response object
 */
const createResponse = (status, messageKey, data = null, params = {}) => {
  const message = t(messageKey, params);
  
  const response = {
    status,
    message: message.en,
    messageAr: message.ar
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Create a bilingual error object
 * @param {string} messageKey - Translation key for the error message
 * @param {number} statusCode - HTTP status code
 * @param {object} params - Optional parameters for message interpolation
 * @returns {Error} Error object with bilingual message
 */
const createError = (messageKey, statusCode = 400, params = {}) => {
  const message = t(messageKey, params);
  const error = new Error(message.en);
  error.messageAr = message.ar;
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  t,
  createResponse,
  createError,
  translations
};
