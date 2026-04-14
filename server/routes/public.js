const router = require('express').Router();
const Ad = require('../models/Ad');
const SiteConfig = require('../models/SiteConfig');
const Song = require('../models/Song');
const Notification = require('../models/Notification');

const isActiveByDate = (item) => {
  const now = Date.now();
  if (!item.isActive) return false;
  if (item.startAt && new Date(item.startAt).getTime() > now) return false;
  if (item.endAt && new Date(item.endAt).getTime() < now) return false;
  return true;
};

router.get('/home-config', async (req, res) => {
  try {
    const config = await SiteConfig.findOne({ key: 'default' }).lean();
    const sliders = (config?.sliders || [])
      .filter((item) => item.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const featuredSongs = (config?.featuredSongIds?.length)
      ? await Song.find({
          _id: { $in: config.featuredSongIds },
          moderationStatus: 'approved'
        }).populate('uploader', 'username avatar followers')
      : [];

    res.status(200).json({ sliders, featuredSongs });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/ads/banner', async (req, res) => {
  try {
    const ads = await Ad.find({ type: 'banner' }).sort({ priority: -1, createdAt: -1 }).lean();
    res.status(200).json(ads.filter(isActiveByDate));
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/ads/audio/random', async (req, res) => {
  try {
    const ads = await Ad.find({ type: 'audio' }).sort({ priority: -1, createdAt: -1 }).lean();
    const active = ads.filter(isActiveByDate);
    if (!active.length) return res.status(200).json(null);

    const randomIndex = Math.floor(Math.random() * active.length);
    res.status(200).json(active[randomIndex]);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const audience = req.query.audience || 'all';
    const notifications = await Notification.find({
      isActive: true,
      audience: { $in: ['all', audience] }
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
