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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mini-soundcloud')
  .then(() => console.log("✅ DB Connection Successful!"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// Sử dụng Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/songs', songRoute);

// Chạy Server (Đây là phần quan trọng giữ cho server luôn chạy)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
