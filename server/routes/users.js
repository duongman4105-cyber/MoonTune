const router = require('express').Router();
const User = require('../models/User');
const Song = require('../models/Song');
const cloudinary = require('../utils/cloudinary');
const upload = require('../middleware/multer');
const verifyToken = require('../middleware/auth');

// 1. Cập nhật User (Avatar, Username, About)
router.put('/:id', verifyToken, upload.single('avatar'), async (req, res) => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
        try {
            const updatedData = {
                username: req.body.username,
                about: req.body.about // Cập nhật thêm about
            };
            
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, { folder: "avatars" });
                updatedData.avatar = result.secure_url;
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { $set: updatedData },
                { new: true }
            );
            
            const { password, ...others } = updatedUser._doc;
            res.status(200).json(others);
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("You can only update your account!");
    }
});

// 1. Toggle Like (Yêu thích/Bỏ yêu thích)
router.put('/like/:songId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const song = await Song.findById(req.params.songId);
    
    if (!song) return res.status(404).json("Song not found");

    if (!user.likedSongs.includes(req.params.songId)) {
      // Chưa like -> Thêm vào list Like & Tăng count
      await user.updateOne({ $push: { likedSongs: req.params.songId } });
      await song.updateOne({ $inc: { likes: 1 } });
      res.status(200).json("Liked");
    } else {
      // Đã like -> Xóa khỏi list Like & Giảm count
      await user.updateOne({ $pull: { likedSongs: req.params.songId } });
      await song.updateOne({ $inc: { likes: -1 } });
      res.status(200).json("Disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. Add to History (Lịch sử nghe)
router.put('/history/:songId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Xóa bài hát nếu đã có trong history để đưa lên đầu (tránh trùng lặp)
    const newHistory = user.history.filter(id => id.toString() !== req.params.songId);
    newHistory.unshift(req.params.songId); // Thêm vào đầu danh sách

    // Giới hạn lịch sử 20 bài gần nhất
    if (newHistory.length > 20) newHistory.pop();

    await user.updateOne({ history: newHistory });
    res.status(200).json("Added to history");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. Get User Info (Lấy chi tiết Likes & History)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
        .populate('likedSongs') // Lấy full thông tin bài hát đã like
        .populate('history');   // Lấy full thông tin lịch sử
    const { password, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
