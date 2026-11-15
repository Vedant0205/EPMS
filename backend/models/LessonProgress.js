const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const lessonProgressSchema = {
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  watchedSeconds: { type: Number, default: 0 },
  lastPositionSeconds: { type: Number, default: 0 },
  watchPercentage: { type: Number, default: 0 }
};

module.exports = createModel('LessonProgress', lessonProgressSchema);
