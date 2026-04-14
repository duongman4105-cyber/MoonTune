const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  linkUrl: { type: String, default: '' },
  audience: {
    type: String,
    enum: ['all', 'creators', 'verified'],
    default: 'all'
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
