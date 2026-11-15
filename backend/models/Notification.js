const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const notificationSchema = {
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['warning', 'attendance', 'course', 'announcement', 'system'],
    default: 'system'
  },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  metadata: { type: Object, default: {} }
};

module.exports = createModel('Notification', notificationSchema);
