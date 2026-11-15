const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'epms_super_secure_jwt_secret_key_2026_educational_monitoring';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id || user.id,
      _id: user._id || user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      identifier: user.identifier
    },
    secret,
    { expiresIn }
  );
};

// @desc    Register new student or teacher
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, identifier, password, confirmPassword, role, department } = req.body;

    if (!name || !email || !identifier || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required registration fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (identifier.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Identifier (Student/Teacher ID) must be at least 3 characters.' });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const existingId = await User.findOne({ identifier: identifier.trim() });
    if (existingId) {
      return res.status(400).json({ success: false, message: 'This Student ID / Teacher ID is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      identifier: identifier.trim().toUpperCase(),
      password: hashedPassword,
      role: role === 'teacher' ? 'teacher' : 'student',
      department: department || 'Computer Science & Engineering',
      lastActive: new Date().toISOString()
    });

    const token = generateToken(newUser);

    const userResponse = {
      _id: newUser._id,
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      identifier: newUser.identifier,
      role: newUser.role,
      department: newUser.department,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
};

// @desc    User Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update lastActive
    await User.findByIdAndUpdate(user._id, { lastActive: new Date().toISOString() });

    const token = generateToken(user);

    const userResponse = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      identifier: user.identifier,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      lastActive: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        identifier: user.identifier,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        phone: user.phone,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching profile.', error: err.message });
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Security best practice: don't reveal if user does not exist
      return res.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 3600000).toISOString()
    });

    res.json({
      success: true,
      message: 'Password reset instructions have been generated. (Demo token: ' + resetToken + ')',
      resetToken
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// @desc    Reset Password with Token
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({ success: true, message: 'Password has been successfully updated. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error resetting password.', error: err.message });
  }
};
