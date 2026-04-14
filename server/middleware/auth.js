const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = (req, res, next) => {
  const tokenHeader = req.headers.token || req.headers.authorization;
  if (!tokenHeader) return res.status(401).json('You are not authenticated!');

  const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.split(' ')[1] : tokenHeader;

  jwt.verify(token, 'SECRET_KEY_123', (err, user) => {
    if (err) return res.status(403).json('Token is not valid!');
    req.user = user;
    next();
  });
};

const verifyAdmin = async (req, res, next) => {
  try {
    if (req.user?.isAdmin === true) return next();

    const dbUser = await User.findById(req.user?.id).select('isAdmin');
    if (!dbUser?.isAdmin) {
      return res.status(403).json('Admin only.');
    }

    req.user.isAdmin = true;
    next();
  } catch (err) {
    res.status(500).json('Admin verification failed.');
  }
};

module.exports = verifyToken;
module.exports.verifyAdmin = verifyAdmin;
