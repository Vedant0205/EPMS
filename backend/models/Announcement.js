const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const announcementSchema = {
  title: { type: String, required: true },
  content: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  }
};

module.exports = createModel('Announcement', announcementSchema);
