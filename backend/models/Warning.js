const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const warningSchema = {
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  category: {
    type: String,
    enum: ['Low Attendance', 'Low Course Completion', 'Inactive Student', 'Missing Lessons', 'General Warning'],
    required: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active'
  },
  studentNote: { type: String, default: '' },
  acknowledgedAt: { type: Date }
};

module.exports = createModel('Warning', warningSchema);
