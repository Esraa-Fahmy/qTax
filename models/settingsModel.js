const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Pricing Settings
    baseFare: { type: Number, default: 10, required: true }, // فتحة العداد
    pricePerKm: { type: Number, default: 5, required: true }, // سعر الكيلو
    pricePerMinute: { type: Number, default: 1, required: true }, // سعر الدقيقة
    minFare: { type: Number, default: 15, required: true }, // أقل سعر للرحلة

    // Vehicle Multipliers (نسب زيادة لكل نوع عربية)
    vehicleMultipliers: {
      economy: { type: Number, default: 1.0 },
      comfort: { type: Number, default: 1.3 },
      premium: { type: Number, default: 1.6 },
    },

    // Surge Pricing (أوقات الذروة)
    surgeMultiplier: { type: Number, default: 1.0 },
    isSurgeActive: { type: Boolean, default: false },

    // App Commission (نسبة التطبيق)
    appCommission: { type: Number, default: 10 }, // %
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
