const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

// Load file .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Hàm làm sạch dữ liệu (xóa khoảng trắng thừa nếu có)
const cleanEnv = (val) => val ? val.toString().trim() : "";

const cloud_name = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
const api_key = cleanEnv(process.env.CLOUDINARY_API_KEY);
const api_secret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

// Kiểm tra kỹ
if (!cloud_name || !api_key || !api_secret) {
  console.error("\n❌ LỖI: File .env bị thiếu thông tin hoặc chưa lưu.");
}

cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: api_secret,
});

module.exports = cloudinary;
