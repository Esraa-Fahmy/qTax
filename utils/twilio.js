// utils/twilio.js
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendOtp = async (phone) => {
  return client.verify.v2
    .services(process.env.TWILIO_VERIFY_SID)
    .verifications.create({ to: phone, channel: "sms" });
};

exports.verifyOtp = async (phone, code) => {
  return client.verify.v2
    .services(process.env.TWILIO_VERIFY_SID)
    .verificationChecks.create({ to: phone, code });
};
