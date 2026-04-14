const mongoose = require('mongoose');

const UserNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourceNotificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  linkUrl: { type: String, default: '' },
  type: {
    type: String,
    enum: ['moderation-approved', 'moderation-rejected', 'song-pending-review', 'comment-reply', 'system'],
    default: 'system'
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('UserNotification', UserNotificationSchema);
