const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  code: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // Hết hạn sau 5 phút (300 giây)
});

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
