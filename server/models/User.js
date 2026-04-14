const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  blockedReason: { type: String, default: '' },
  blockedAt: { type: Date, default: null },
  avatar: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  about: { type: String, default: "" }, // Thêm trường about
  isFollowingPrivate: { type: Boolean, default: false },
  badges: [{ type: String }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  albums: [{
    name: { type: String, required: true },
    songIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }]
  }],
  likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }], // Danh sách bài đã like
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],    // Lịch sử nghe
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
