const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY_123';

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const rawEmail = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !rawEmail || !password) {
      return res.status(400).json('Vui lòng nhập đầy đủ tên người dùng, email và mật khẩu.');
    }

    if (/admin/i.test(rawEmail)) {
      return res.status(400).json('Email chứa từ khóa không hợp lệ. Vui lòng dùng email khác.');
    }

    const existingEmail = await User.findOne({ email: rawEmail }).select('_id').lean();
    if (existingEmail) {
      return res.status(400).json('Email này đã được đăng ký. Vui lòng dùng email khác.');
    }

    const existingUsername = await User.findOne({ username }).select('_id').lean();
    if (existingUsername) {
      return res.status(400).json('Tên người dùng đã tồn tại. Vui lòng chọn tên khác.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      username,
      email: rawEmail,
      password: hashedPassword,
    });
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    if (err?.code === 11000) {
      if (err?.keyPattern?.email) {
        return res.status(400).json('Email này đã được đăng ký. Vui lòng dùng email khác.');
      }
      if (err?.keyPattern?.username) {
        return res.status(400).json('Tên người dùng đã tồn tại. Vui lòng chọn tên khác.');
      }
      return res.status(400).json('Thông tin đăng ký đã tồn tại.');
    }

    res.status(500).json('Không thể đăng ký lúc này. Vui lòng thử lại sau.');
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("User not found");

    if (user.isBlocked) {
      return res.status(403).json(user.blockedReason || 'Tài khoản đã bị khóa.');
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json("Wrong password");

    const token = jwt.sign({ id: user._id, isAdmin: !!user.isAdmin }, JWT_SECRET, { expiresIn: "5d" });
    const { password, ...others } = user._doc;
    
    res.status(200).json({ ...others, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// ADMIN LOGIN
router.post('/admin/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json('User not found');
    if (!user.isAdmin) return res.status(403).json('Tài khoản này không có quyền admin.');
    if (user.isBlocked) return res.status(403).json(user.blockedReason || 'Tài khoản admin đã bị khóa.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json('Wrong password');

    const token = jwt.sign({ id: user._id, isAdmin: true }, JWT_SECRET, { expiresIn: '5d' });
    const { password, ...others } = user._doc;

    res.status(200).json({ ...others, token, isAdmin: true });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ error: err.message || 'Admin login failed' });
  }
});

module.exports = router;
