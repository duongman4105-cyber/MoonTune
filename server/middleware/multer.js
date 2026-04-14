const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ tạm thời và lọc file
module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const imageExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    const audioExt = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']);

    if (file.fieldname === 'cover' || file.fieldname === 'image' || file.mimetype.startsWith('image/')) {
      if (!imageExt.has(ext) && !file.mimetype.startsWith('image/')) {
        cb(new Error('Image type is not supported'), false);
        return;
      }
      cb(null, true);
      return;
    }

    if (file.fieldname === 'audio' || file.mimetype.startsWith('audio/')) {
      if (!audioExt.has(ext) && !file.mimetype.startsWith('audio/')) {
        cb(new Error('Audio type is not supported'), false);
        return;
      }
      cb(null, true);
      return;
    }

    cb(new Error('File type is not supported'), false);
    return;
  },
});
