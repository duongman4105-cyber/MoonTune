const mongoose = require('mongoose');

// Định nghĩa Schema cho Comment riêng để có thể tái sử dụng hoặc lồng nhau
const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  userAvatar: { type: String, default: '' },
  text: String,
  timestamp: Number,
  createdAt: { type: Date, default: Date.now },
  // Thêm mảng replies để chứa các câu trả lời
  replies: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    userAvatar: { type: String, default: '' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  audioUrl: { type: String, required: true }, // URL file nhạc (Cloudinary/Local)
  coverImage: { type: String, default: '' }, // URL ảnh bìa
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationNotes: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  qualityScore: { type: Number, default: null },
  copyrightStatus: {
    type: String,
    enum: ['unknown', 'clear', 'flagged'],
    default: 'unknown'
  },
  isFeatured: { type: Boolean, default: false },
  plays: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  duration: { type: Number, default: 0 }, // Thêm trường duration
  // Sử dụng Schema vừa định nghĩa
  comments: [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Song', SongSchema);
