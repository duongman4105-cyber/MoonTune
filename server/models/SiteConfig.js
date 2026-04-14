const mongoose = require('mongoose');

const SliderItemSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: true });

const SiteConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },
  sliders: [SliderItemSchema],
  featuredSongIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
}, { timestamps: true });

module.exports = mongoose.model('SiteConfig', SiteConfigSchema);
