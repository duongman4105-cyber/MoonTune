const router = require('express').Router();
const User = require('../models/User');
const Song = require('../models/Song');
const UserNotification = require('../models/UserNotification');
const cloudinary = require('../utils/cloudinary');
const upload = require('../middleware/multer');
const verifyToken = require('../middleware/auth');

router.get('/search', async (req, res) => {
  try {
    const keyword = (req.query.q || '').trim();
    if (!keyword) {
      return res.status(200).json({ users: [] });
    }

    const users = await User.find({
      username: { $regex: keyword, $options: 'i' },
    })
      .select('_id username avatar followers')
      .limit(8)
      .lean();

    const normalized = users.map((item) => ({
      _id: item._id,
      username: item.username,
      avatar: item.avatar || '',
      followerCount: Array.isArray(item.followers) ? item.followers.length : 0,
    }));

    return res.status(200).json({ users: normalized });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 1. Cập nhật User (Avatar, Username, About)
router.put('/:id', verifyToken, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
        try {
      const updatedData = {};

      if (typeof req.body.username === 'string' && req.body.username.trim()) {
        updatedData.username = req.body.username.trim();
      }

      if (typeof req.body.about === 'string') {
        updatedData.about = req.body.about;
      }

      if (typeof req.body.isFollowingPrivate !== 'undefined') {
        if (req.body.isFollowingPrivate === 'true' || req.body.isFollowingPrivate === true) {
          updatedData.isFollowingPrivate = true;
        }

        if (req.body.isFollowingPrivate === 'false' || req.body.isFollowingPrivate === false) {
          updatedData.isFollowingPrivate = false;
        }
      }
            
      if (req.files?.avatar?.[0]) {
        const result = await cloudinary.uploader.upload(req.files.avatar[0].path, { folder: "avatars" });
        updatedData.avatar = result.secure_url;
      }

      if (req.files?.coverImage?.[0]) {
        const result = await cloudinary.uploader.upload(req.files.coverImage[0].path, { folder: "profile-covers" });
        updatedData.coverImage = result.secure_url;
      }

      if (Object.keys(updatedData).length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật.' });
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

// Follow / Unfollow user
router.put('/:id/follow', verifyToken, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json('Bạn không thể tự theo dõi chính mình.');
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json('User not found');
    }

    const isAlreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUser._id.toString()
    );

    if (!isAlreadyFollowing) {
      await targetUser.updateOne({ $addToSet: { followers: currentUser._id } });
      await currentUser.updateOne({ $addToSet: { following: targetUser._id } });
      return res.status(200).json({ following: true, message: 'Đã theo dõi người dùng.' });
    }

    await targetUser.updateOne({ $pull: { followers: currentUser._id } });
    await currentUser.updateOne({ $pull: { following: targetUser._id } });
    return res.status(200).json({ following: false, message: 'Đã bỏ theo dõi người dùng.' });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/:id/followers', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', '_id username avatar');
    if (!user) return res.status(404).json('User not found');

    return res.status(200).json({
      total: user.followers.length,
      users: user.followers,
    });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/:id/following', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', '_id username avatar');
    if (!user) return res.status(404).json('User not found');

    const canViewFollowing =
      !user.isFollowingPrivate ||
      req.user.isAdmin ||
      req.user.id === user._id.toString();

    if (!canViewFollowing) {
      return res.status(403).json({
        message: 'Danh sách đang theo dõi đã được đặt ở chế độ riêng tư.',
        isFollowingPrivate: true,
      });
    }

    return res.status(200).json({
      total: user.following.length,
      users: user.following,
      isFollowingPrivate: !!user.isFollowingPrivate,
    });
  } catch (err) {
    return res.status(500).json(err);
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

// 2b. Lấy lịch sử nghe
router.get('/:id/history', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json('You can only read your own listening history!');
    }

    const user = await User.findById(req.params.id)
      .populate({
        path: 'history',
        options: { lean: true }
      })
      .select('history');

    if (!user) return res.status(404).json('User not found');

    const history = (user.history || []).filter(Boolean);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. Get User Info (Lấy chi tiết Likes & History)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
        .populate('likedSongs') // Lấy full thông tin bài hát đã like
        .populate('history')   // Lấy full thông tin lịch sử
        .populate('albums.songIds');

    if (!user) return res.status(404).json('User not found');

    const { password, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/:id/albums', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json('You can only create albums for your own account!');
    }

    const name = (req.body.name || '').trim();
    const songIds = Array.isArray(req.body.songIds) ? [...new Set(req.body.songIds)] : [];

    if (!name) {
      return res.status(400).json({ message: 'Tên album không được để trống.' });
    }

    if (songIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 bài hát để tạo album.' });
    }

    const targetUser = await User.findById(req.params.id)
      .select('likedSongs albums')
      .lean();

    if (!targetUser) return res.status(404).json('User not found');

    const uploadedSongs = await Song.find({ uploader: req.params.id }).select('_id').lean();
    const allowedSongIds = new Set([
      ...(targetUser.likedSongs || []).map((id) => id.toString()),
      ...uploadedSongs.map((song) => song._id.toString()),
    ]);

    const invalidSongId = songIds.find((id) => !allowedSongIds.has(id.toString()));
    if (invalidSongId) {
      return res.status(403).json({ message: 'Album chỉ được chứa bài nhạc đã thích hoặc đã đăng.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          albums: {
            name,
            songIds,
          },
        },
      },
      { new: true }
    )
      .populate('likedSongs')
      .populate('history')
      .populate('albums.songIds');

    const { password, ...other } = updatedUser._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id/notifications', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json('You can only read your own notifications!');
    }

    const notifications = await UserNotification.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await UserNotification.countDocuments({ userId: req.params.id, isRead: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id/notifications/read-all', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json('You can only update your own notifications!');
    }

    await UserNotification.updateMany(
      { userId: req.params.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
