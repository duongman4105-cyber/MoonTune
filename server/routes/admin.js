const router = require('express').Router();
const User = require('../models/User');
const Song = require('../models/Song');
const Ad = require('../models/Ad');
const SiteConfig = require('../models/SiteConfig');
const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');
const upload = require('../middleware/multer');
const cloudinary = require('../utils/cloudinary');
const verifyToken = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/auth');

router.use(verifyToken, verifyAdmin);

router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Thiếu file ảnh upload.' });
    }

    const folder = (req.body.folder || 'admin-assets').toString().trim() || 'admin-assets';
    const result = await cloudinary.uploader.upload(req.file.path, { folder });
    res.status(200).json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: 'Upload ảnh thất bại.', error: err.message });
  }
});

const getStartDate = (period) => {
  const now = new Date();
  if (period === 'day') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
};

router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalSongs, pendingSongs, songsAgg, blockedUsers] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Song.countDocuments({ moderationStatus: 'pending' }),
      Song.aggregate([
        {
          $group: {
            _id: null,
            totalPlays: { $sum: '$plays' },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: { $size: '$comments' } }
          }
        }
      ]),
      User.countDocuments({ isBlocked: true }),
    ]);

    const stats = songsAgg[0] || { totalPlays: 0, totalLikes: 0, totalComments: 0 };

    res.status(200).json({
      totalUsers,
      totalSongs,
      pendingSongs,
      blockedUsers,
      totalPlays: stats.totalPlays,
      totalLikes: stats.totalLikes,
      totalComments: stats.totalComments,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('history', 'title artist coverImage createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/users/:id/detail', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('likedSongs', 'title artist coverImage')
      .populate('history', 'title artist coverImage createdAt');

    if (!user) return res.status(404).json('Không tìm thấy người dùng');

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/users/:id/songs', async (req, res) => {
  try {
    const songs = await Song.find({ uploader: req.params.id })
      .sort({ createdAt: -1 })
      .populate('uploader', 'username avatar');

    res.status(200).json(songs);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const isAdmin = !!req.body.isAdmin;

    if (req.user.id === req.params.id && !isAdmin) {
      return res.status(400).json('Bạn không thể xóa quyền admin của chính mình.');
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isAdmin } },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json('User not found');

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/users/:id/badges', async (req, res) => {
  try {
    const badges = Array.isArray(req.body.badges) ? req.body.badges : [];

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { badges } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json('User not found');

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/users/:id/block', async (req, res) => {
  try {
    const isBlocked = !!req.body.isBlocked;
    const blockedReason = (req.body.blockedReason || '').trim();

    if (req.user.id === req.params.id && isBlocked) {
      return res.status(400).json('Bạn không thể khóa tài khoản admin của chính mình.');
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isBlocked,
          blockedReason: isBlocked ? blockedReason : '',
          blockedAt: isBlocked ? new Date() : null,
        }
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json('User not found');

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json('Bạn không thể tự xóa tài khoản admin của chính mình.');
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json('Không tìm thấy người dùng');

    const userSongs = await Song.find({ uploader: req.params.id }).select('_id');
    const userSongIds = userSongs.map((song) => song._id);

    await Song.deleteMany({ uploader: req.params.id });

    await User.updateMany(
      {},
      {
        $pull: {
          followers: targetUser._id,
          following: targetUser._id,
          likedSongs: { $in: userSongIds },
          history: { $in: userSongIds },
          'albums.$[].songIds': { $in: userSongIds },
        }
      }
    );

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/songs/pending', async (req, res) => {
  try {
    const songs = await Song.find({ moderationStatus: 'pending' })
      .sort({ createdAt: -1 })
      .populate('uploader', 'username avatar email badges');

    res.status(200).json(songs);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/songs/:id/moderate', verifyAdmin, async (req, res) => {
  try {
    const action = req.body.action === 'approved' ? 'approved' : 'rejected';
    const moderationNotes = (req.body.moderationNotes || '').trim();
    const qualityScore = Number.isFinite(Number(req.body.qualityScore)) ? Number(req.body.qualityScore) : null;
    const copyrightStatus = ['unknown', 'clear', 'flagged'].includes(req.body.copyrightStatus)
      ? req.body.copyrightStatus
      : 'unknown';

    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          moderationStatus: action,
          moderationNotes,
          qualityScore,
          copyrightStatus,
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      },
      { new: true }
    ).populate('uploader', 'username avatar email');

    if (!updatedSong) return res.status(404).json('Song not found');

    const isApproved = action === 'approved';
    const uploaderId = updatedSong.uploader?._id || updatedSong.uploader;
    console.log('🔔 [Moderation] Creating notification for:', { uploaderId, songTitle: updatedSong.title, action });
    
    if (uploaderId) {
      try {
        const notification = await UserNotification.create({
          userId: uploaderId,
          title: isApproved ? 'Bạn đã được duyệt nhạc thành công' : 'Bài hát của bạn bị từ chối',
          message: isApproved
            ? `Bài hát "${updatedSong.title}" đã được phê duyệt và hiển thị công khai.`
            : `Bài hát "${updatedSong.title}" chưa được phê duyệt. Vui lòng xem ghi chú kiểm duyệt để chỉnh sửa và đăng lại.`,
          linkUrl: `/song/${updatedSong._id}`,
          type: isApproved ? 'moderation-approved' : 'moderation-rejected',
          isRead: false,
        });
        console.log('✅ [Moderation] Notification created:', notification._id);
      } catch (notifErr) {
        console.error('❌ [Moderation] Error creating notification:', notifErr.message);
      }
    } else {
      console.warn('⚠️ [Moderation] No uploaderId found');
    }

    res.status(200).json(updatedSong);
  } catch (err) {
    console.error('❌ [Moderation] Error:', err.message);
    res.status(500).json(err);
  }
});

router.delete('/songs/:id', async (req, res) => {
  try {
    const deletedSong = await Song.findByIdAndDelete(req.params.id);
    if (!deletedSong) return res.status(404).json('Không tìm thấy bài hát');

    await User.updateMany(
      {},
      {
        $pull: {
          likedSongs: deletedSong._id,
          history: deletedSong._id,
          'albums.$[].songIds': deletedSong._id,
        },
      }
    );

    res.status(200).json({ message: 'Xóa bài hát thành công' });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/ads', async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/ads', async (req, res) => {
  try {
    const newAd = new Ad({ ...req.body, createdBy: req.user.id });
    const savedAd = await newAd.save();
    res.status(200).json(savedAd);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/ads/:id', async (req, res) => {
  try {
    const updatedAd = await Ad.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updatedAd) return res.status(404).json('Không tìm thấy quảng cáo');
    res.status(200).json(updatedAd);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/ads/:id', async (req, res) => {
  try {
    const deletedAd = await Ad.findByIdAndDelete(req.params.id);
    if (!deletedAd) return res.status(404).json('Không tìm thấy quảng cáo');
    res.status(200).json({ message: 'Xóa quảng cáo thành công' });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/home-config', async (req, res) => {
  try {
    let config = await SiteConfig.findOne({ key: 'default' }).populate('featuredSongIds');
    if (!config) {
      config = await SiteConfig.create({ key: 'default', sliders: [], featuredSongIds: [] });
    }
    res.status(200).json(config);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/home-config', async (req, res) => {
  try {
    const sliders = Array.isArray(req.body.sliders) ? req.body.sliders : [];
    const featuredSongIds = Array.isArray(req.body.featuredSongIds) ? req.body.featuredSongIds : [];

    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'default' },
      { $set: { sliders, featuredSongIds } },
      { upsert: true, new: true }
    );

    await Song.updateMany({}, { $set: { isFeatured: false } });
    if (featuredSongIds.length > 0) {
      await Song.updateMany({ _id: { $in: featuredSongIds } }, { $set: { isFeatured: true } });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const message = (req.body.message || '').trim();
    const linkUrl = (req.body.linkUrl || '').trim();

    if (!title || !message) {
      return res.status(400).json('Thiếu tiêu đề hoặc nội dung thông báo.');
    }

    const newNotification = new Notification({
      title,
      message,
      linkUrl,
      audience: 'all',
      isActive: req.body.isActive !== false,
      createdBy: req.user.id,
    });

    const saved = await newNotification.save();

    const users = await User.find({ isBlocked: { $ne: true } }).select('_id');
    if (users.length > 0) {
      const payloads = users.map((u) => ({
        userId: u._id,
        sourceNotificationId: saved._id,
        title,
        message,
        linkUrl,
        type: 'system',
        isRead: false,
      }));
      await UserNotification.insertMany(payloads);
    }

    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json('Không tìm thấy thông báo');

    await UserNotification.deleteMany({ sourceNotificationId: deleted._id });
    res.status(200).json({ message: 'Xóa thông báo thành công' });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/analytics/plays', async (req, res) => {
  try {
    const startDate = getStartDate(req.query.period || 'month');

    const topSongs = await Song.find({
      moderationStatus: 'approved',
      updatedAt: { $gte: startDate },
    })
      .sort({ plays: -1 })
      .limit(10)
      .select('title artist plays likes createdAt');

    res.status(200).json(topSongs);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/analytics/engagement', async (req, res) => {
  try {
    const songs = await Song.find({ moderationStatus: 'approved' })
      .sort({ likes: -1 })
      .limit(10)
      .select('title artist likes plays comments');

    const enriched = songs.map((song) => ({
      _id: song._id,
      title: song.title,
      artist: song.artist,
      likes: song.likes || 0,
      plays: song.plays || 0,
      comments: Array.isArray(song.comments) ? song.comments.length : 0,
    }));

    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/analytics/growth', async (req, res) => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(200).json(growth);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
