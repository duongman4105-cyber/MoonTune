const router = require('express').Router();
const Song = require('../models/Song');
const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const jwt = require('jsonwebtoken');
const cloudinary = require('../utils/cloudinary');
const upload = require('../middleware/multer');
const verifyToken = require('../middleware/auth');

const getOptionalRequester = async (req) => {
    const tokenHeader = req.headers.token || req.headers.authorization;
    if (!tokenHeader) return null;

    const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.split(' ')[1] : tokenHeader;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, 'SECRET_KEY_123');
        return { id: decoded.id, isAdmin: !!decoded.isAdmin };
    } catch (err) {
        return null;
    }
};

// 1. Lấy danh sách + TÌM KIẾM + LỌC THEO UPLOADER
router.get('/', async (req, res) => {
  const query = req.query.q;
  const uploaderId = req.query.uploader; // Lấy tham số uploader từ URL

  try {
        const requester = await getOptionalRequester(req);

        const onlyApproved = {
            $or: [
                { moderationStatus: 'approved' },
                { moderationStatus: { $exists: false } },
            ],
        };
    let songs;
    if (query) {
            songs = await Song.find({
                $and: [
                    {
                        $or: [
                            { title: { $regex: query, $options: "i" } },
                            { artist: { $regex: query, $options: "i" } }
                        ]
                    },
                    onlyApproved,
                ]
            }).sort({ createdAt: -1 });
    } else if (uploaderId) {
            const isOwner = requester?.id && requester.id === uploaderId;
            if (requester?.isAdmin || isOwner) {
                songs = await Song.find({ uploader: uploaderId }).sort({ createdAt: -1 });
            } else {
                songs = await Song.find({ uploader: uploaderId, ...onlyApproved }).sort({ createdAt: -1 });
            }
    } else {
            songs = await Song.find(onlyApproved).sort({ createdAt: -1 });
    }
    res.status(200).json(songs);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. Upload bài hát mới
router.post('/', verifyToken, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    try {
        const audioFile = req.files?.audio?.[0];
        const coverFile = req.files?.cover?.[0] || null;

        if (!audioFile) {
            return res.status(400).json({ message: 'Vui lòng chọn file nhạc trước khi upload.' });
        }

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
            duration: req.body.duration || 0, // Lưu duration
            moderationStatus: 'pending'
        });

        const savedSong = await newSong.save();

        await UserNotification.create({
          userId: req.user.id,
          title: 'Bài hát đã gửi chờ kiểm duyệt',
          message: `Bài hát "${savedSong.title}" đã được gửi và đang chờ admin kiểm duyệt.`,
          linkUrl: `/song/${savedSong._id}`,
          type: 'song-pending-review',
          isRead: false,
        });

                const admins = await User.find({ isAdmin: true, isBlocked: { $ne: true } }).select('_id');
                if (admins.length > 0) {
                    const adminNotifications = admins.map((admin) => ({
                        userId: admin._id,
                        title: 'Có bài hát mới chờ duyệt',
                        message: `"${savedSong.title}" vừa được gửi lên hệ thống và đang chờ kiểm duyệt.`,
                        linkUrl: '/admin',
                        type: 'system',
                        isRead: false,
                    }));
                    await UserNotification.insertMany(adminNotifications);
                }

        res.status(200).json(savedSong);
    } catch (err) {
        res.status(500).json({ message: err.message || 'Tải bài hát thất bại.' });
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
            userAvatar: req.body.userAvatar || '',
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
        if (!song) return res.status(404).json("Song not found");
        const comment = song.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json("Comment not found");

        const newReply = {
            userId: req.user.id,
            username: req.body.username,
            userAvatar: req.body.userAvatar || '',
            text: req.body.text,
            createdAt: new Date()
        };
        comment.replies.push(newReply);
        await song.save();

        const createdReply = comment.replies[comment.replies.length - 1];
        const commentOwnerId = comment.userId ? comment.userId.toString() : '';
        const replierId = req.user.id;

        if (commentOwnerId && commentOwnerId !== replierId) {
            await UserNotification.create({
                userId: commentOwnerId,
                title: 'Bạn có phản hồi bình luận mới',
                message: `${req.body.username || 'Một người dùng'} đã trả lời bình luận của bạn trong bài "${song.title}".`,
                linkUrl: `/song/${song._id}?commentId=${comment._id}&replyId=${createdReply?._id || ''}`,
                type: 'comment-reply',
                isRead: false,
            });
        }

        res.status(200).json(song);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 6. Lấy chi tiết 1 bài hát
router.get('/find/:id', async (req, res) => {
    try {
                const song = await Song.findById(req.params.id).populate('uploader', '_id username avatar followers');
                if (!song) return res.status(404).json('Song not found');

                if (song.moderationStatus && song.moderationStatus !== 'approved') {
                    const requester = await getOptionalRequester(req);
                    if (!requester?.id) {
                        return res.status(403).json('Bài hát này đang chờ kiểm duyệt.');
                    }

                    const uploaderId = typeof song.uploader === 'object'
                        ? song.uploader?._id?.toString()
                        : song.uploader?.toString();
                    const isOwner = uploaderId === requester.id;
                    if (!requester?.isAdmin && !isOwner) {
                        return res.status(403).json('Bài hát này đang chờ kiểm duyệt.');
                    }
                }

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
