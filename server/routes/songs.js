const router = require('express').Router();
const Song = require('../models/Song');
const cloudinary = require('../utils/cloudinary');
const upload = require('../middleware/multer');
const verifyToken = require('../middleware/auth');

// 1. Lấy danh sách + TÌM KIẾM + LỌC THEO UPLOADER
router.get('/', async (req, res) => {
  const query = req.query.q;
  const uploaderId = req.query.uploader; // Lấy tham số uploader từ URL

  try {
    let songs;
    if (query) {
      songs = await Song.find({
        $or: [
            { title: { $regex: query, $options: "i" } },
            { artist: { $regex: query, $options: "i" } }
        ]
      }).sort({ createdAt: -1 });
    } else if (uploaderId) {
      // Nếu có uploaderId, chỉ lấy bài hát của người đó
      songs = await Song.find({ uploader: uploaderId }).sort({ createdAt: -1 });
    } else {
      songs = await Song.find().sort({ createdAt: -1 });
    }
    res.status(200).json(songs);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. Upload bài hát mới
router.post('/', verifyToken, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    try {
        const audioFile = req.files['audio'][0];
        const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

        // Upload Audio lên Cloudinary
        const audioResult = await cloudinary.uploader.upload(audioFile.path, { resource_type: "video", folder: "songs" });
        
        // Upload Cover nếu có
        let coverUrl = "";
        if (coverFile) {
            const coverResult = await cloudinary.uploader.upload(coverFile.path, { folder: "covers" });
            coverUrl = coverResult.secure_url;
        }

        const newSong = new Song({
            title: req.body.title,
            artist: req.body.artist,
            audioUrl: audioResult.secure_url,
            coverImage: coverUrl || "https://via.placeholder.com/300",
            uploader: req.user.id,
            duration: req.body.duration || 0 // Lưu duration
        });

        const savedSong = await newSong.save();
        res.status(200).json(savedSong);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. Tăng lượt nghe
router.put('/:id/play', async (req, res) => {
    try {
        await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
        res.status(200).json("View counted");
    } catch (err) {
        res.status(500).json(err);
    }
});

// 4. Like bài hát
router.put('/:id/like', async (req, res) => {
    try {
        // Tăng like lên 1 (đơn giản hóa cho Level 2)
        const updatedSong = await Song.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        res.status(200).json(updatedSong);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 5. Comment vào bài hát (Giữ nguyên, chỉ để tham chiếu vị trí)
router.post('/:id/comment', verifyToken, async (req, res) => {
    try {
        const newComment = {
            userId: req.user.id,
            username: req.body.username,
            text: req.body.text,
            timestamp: req.body.timestamp || 0
        };
        const song = await Song.findByIdAndUpdate(
            req.params.id, 
            { $push: { comments: newComment } },
            { new: true }
        );
        res.status(200).json(song);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- CÁC API MỚI ---

// 8. Xóa Comment
router.delete('/:id/comment/:commentId', verifyToken, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json("Song not found");

        const comment = song.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json("Comment not found");
        
        const commentOwnerId = comment.userId ? comment.userId.toString() : "";
        const songOwnerId = song.uploader ? song.uploader.toString() : "";
        const requestUserId = req.user.id;

        // Cho phép xóa nếu là chủ comment HOẶC chủ bài hát
        if (commentOwnerId === requestUserId || songOwnerId === requestUserId) {
            song.comments.pull(req.params.commentId);
            await song.save();
            res.status(200).json(song);
        } else {
            res.status(403).json("Bạn chỉ có thể xóa bình luận của chính mình!");
        }
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json(err);
    }
});

// 9. Sửa Comment
router.put('/:id/comment/:commentId', verifyToken, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        const comment = song.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json("Comment not found");

        if (comment.userId.toString() === req.user.id) {
            comment.text = req.body.text;
            await song.save();
            res.status(200).json(song);
        } else {
            res.status(403).json("You can only edit your own comments!");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// 10. Reply Comment
router.post('/:id/comment/:commentId/reply', verifyToken, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        const comment = song.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json("Comment not found");

        const newReply = {
            userId: req.user.id,
            username: req.body.username,
            text: req.body.text,
            createdAt: new Date()
        };
        comment.replies.push(newReply);
        await song.save();
        res.status(200).json(song);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 6. Lấy chi tiết 1 bài hát
router.get('/find/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        res.status(200).json(song);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 7. Xóa bài hát (Chỉ chủ sở hữu mới được xóa)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json("Song not found");

        // Kiểm tra quyền sở hữu: ID người gửi request phải trùng với uploader của bài hát
        if (song.uploader.toString() === req.user.id) {
            await Song.findByIdAndDelete(req.params.id);
            res.status(200).json("Song deleted successfully");
        } else {
            res.status(403).json("You are not allowed to delete this song!");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
