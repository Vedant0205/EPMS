const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const systemSettingsSchema = {
  attendanceThreshold: { type: Number, default: 75 },
  completionThreshold: { type: Number, default: 40 },
  inactivityDaysThreshold: { type: Number, default: 7 },
  institutionName: { type: String, default: 'Educational Progress Monitoring System (EPMS)' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
};

module.exports = createModel('SystemSettings', systemSettingsSchema);
