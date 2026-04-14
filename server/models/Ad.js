const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  type: { type: String, enum: ['banner', 'audio'], required: true },
  title: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  linkUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 1 },
  startAt: { type: Date, default: null },
  endAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Ad', AdSchema);
