const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load file .env
dotenv.config({ path: path.join(__dirname, '.env') });

// Import các routes
const songRoute = require('./routes/songs');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const adminRoute = require('./routes/admin');
const publicRoute = require('./routes/public');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://moon-tune-sg5y.vercel.app',
  process.env.CLIENT_URL // từ .env nếu có
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Kết nối Database
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-soundcloud';
console.log('🔗 Connecting to MongoDB:', mongoUri.replace(/:[^@]*@/, ':***@')); // Hide password

let dbConnected = false;

mongoose.connect(mongoUri)
  .then(() => {
    console.log("✅ DB Connection Successful!");
    dbConnected = true;
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
    console.error("📍 MONGO_URI:", mongoUri.replace(/:[^@]*@/, ':***@'));
    // Không exit - Vercel serverless không support exit
  });

// Middleware: Check DB connection trước khi accept API requests
app.use('/api', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ 
      error: 'Database initializing...', 
      message: 'MongoDB is connecting. Please try again in a moment.' 
    });
  }
  next();
});

// Sử dụng Routes - setup ngay từ đầu
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/songs', songRoute);
app.use('/api/admin', adminRoute);
app.use('/api/public', publicRoute);

// Chuẩn hóa lỗi API sang JSON để frontend hiển thị gọn thay vì trang HTML lỗi.
app.use((err, req, res, next) => {
  if (!err) return next();

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  if (typeof err.message === 'string' && err.message.toLowerCase().includes('not supported')) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Export app for Vercel
module.exports = app;

// Chạy Server (local dev only)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
