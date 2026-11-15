const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const attendanceSchema = {
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Normalized YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent', 'leave'], required: true },
  remarks: { type: String, default: '' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
};

module.exports = createModel('Attendance', attendanceSchema);
