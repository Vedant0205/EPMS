const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const userSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  identifier: { type: String, required: true }, // Student ID / Teacher ID
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], required: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  department: { type: String, default: 'Computer Science' },
  lastActive: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
};

module.exports = createModel('User', userSchema);
