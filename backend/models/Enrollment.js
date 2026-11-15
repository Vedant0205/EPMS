const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const enrollmentSchema = {
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
  completionPercentage: { type: Number, default: 0 },
  completedLessonsCount: { type: Number, default: 0 },
  totalLessonsCount: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now }
};

module.exports = createModel('Enrollment', enrollmentSchema);
