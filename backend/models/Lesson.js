const mongoose = require('mongoose');
const createModel = require('./modelFactory');

const lessonSchema = {
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  module: { type: String, default: 'General' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  duration: { type: Number, default: 600 }, // seconds
  order: { type: Number, default: 1 },
  resources: [
    {
      title: { type: String },
      url: { type: String }
    }
  ]
};

module.exports = createModel('Lesson', lessonSchema);
