const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const courseSchema = {
  title: { type: String, required: true, trim: true },
  code: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  thumbnail: { type: String, default: '' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: { type: String, default: 'Faculty Instructor' },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  durationHours: { type: Number, default: 20 },
  status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' }
};

module.exports = createModel('Course', courseSchema);
