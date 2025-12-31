const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  about: { type: String, default: "" }, // Thêm trường about
  likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }], // Danh sách bài đã like
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],    // Lịch sử nghe
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
