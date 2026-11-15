const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'epms_super_secure_jwt_secret_key_2026_educational_monitoring';

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id || decoded._id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User no longer exists.' });
    }

    // Update user's lastActive timestamp non-blockingly
    User.findByIdAndUpdate(user._id, { lastActive: new Date().toISOString() }).catch(() => {});

    req.user = {
      _id: String(user._id),
      id: String(user._id),
      name: user.name,
      email: user.email,
      identifier: user.identifier,
      role: user.role,
      avatar: user.avatar,
      department: user.department
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

const isTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Access denied. Teacher privilege required.' });
  }
  next();
};

const isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied. Student privilege required.' });
  }
  next();
};

module.exports = { verifyToken, isTeacher, isStudent };
