const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ tạm thời và lọc file
module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".mp3" && ext !== ".wav") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});
