const Warning = require('../models/Warning');
const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// @desc    Send warning to student (Teacher)
// @route   POST /api/warnings
exports.createWarning = async (req, res) => {
  try {
    const { studentId, courseId, category, priority, message } = req.body;

    if (!studentId || !category || !message) {
      return res.status(400).json({ success: false, message: 'Student, category, and message are required.' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    let courseName = 'Overall Academics';
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) courseName = course.title;
    }

    const newWarning = await Warning.create({
      student: studentId,
      teacher: req.user.id,
      course: courseId || null,
      category,
      priority: priority || 'Medium',
      message: message.trim(),
      status: 'active'
    });

    // Send high-priority notification to the student
    await Notification.create({
      recipient: studentId,
      sender: req.user.id,
      title: `⚠️ Academic Warning: ${category}`,
      message: `Instructor ${req.user.name} issued a ${priority || 'Medium'} priority notice regarding ${courseName}: "${message.trim()}".`,
      type: 'warning',
      link: '/student/notifications',
      metadata: { warningId: newWarning._id, priority, category }
    });

    res.status(201).json({
      success: true,
      message: 'Warning issued and dispatched to student notifications.',
      warning: newWarning
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create warning', error: err.message });
  }
};

// @desc    Get all warnings sent by teacher (or all warnings)
// @route   GET /api/warnings/teacher
exports.getTeacherWarnings = async (req, res) => {
  try {
    const warnings = await Warning.find({ teacher: req.user.id });
    warnings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Enrich with student and course details
    const allUsers = await User.find({ role: 'student' });
    const userMap = {};
    allUsers.forEach(u => {
      userMap[String(u._id)] = u;
    });

    const allCourses = await Course.find();
    const courseMap = {};
    allCourses.forEach(c => {
      courseMap[String(c._id)] = c.title;
    });

    const enriched = warnings.map(w => ({
      ...w,
      studentName: userMap[String(w.student)] ? userMap[String(w.student)].name : 'Unknown Student',
      studentIdentifier: userMap[String(w.student)] ? userMap[String(w.student)].identifier : 'N/A',
      courseTitle: w.course ? (courseMap[String(w.course)] || 'General') : 'General Warning'
    }));

    res.json({ success: true, warnings: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch warnings', error: err.message });
  }
};

// @desc    Get warnings for current logged-in student
// @route   GET /api/warnings/my-warnings
exports.getMyWarnings = async (req, res) => {
  try {
    const warnings = await Warning.find({ student: req.user.id });
    warnings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const teachers = await User.find({ role: 'teacher' });
    const teacherMap = {};
    teachers.forEach(t => {
      teacherMap[String(t._id)] = t.name;
    });

    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => {
      courseMap[String(c._id)] = c.title;
    });

    const enriched = warnings.map(w => ({
      ...w,
      teacherName: teacherMap[String(w.teacher)] || 'Faculty Advisor',
      courseTitle: w.course ? (courseMap[String(w.course)] || 'General') : 'General Warning'
    }));

    res.json({ success: true, warnings: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student warnings', error: err.message });
  }
};

// @desc    Acknowledge warning (Student)
// @route   PUT /api/warnings/:id/acknowledge
exports.acknowledgeWarning = async (req, res) => {
  try {
    const warning = await Warning.findById(req.params.id);
    if (!warning) {
      return res.status(404).json({ success: false, message: 'Warning not found' });
    }

    if (String(warning.student) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this warning' });
    }

    const { note } = req.body;
    const updated = await Warning.findByIdAndUpdate(
      warning._id,
      {
        status: 'acknowledged',
        studentNote: note || '',
        acknowledgedAt: new Date().toISOString()
      },
      { new: true }
    );

    // Notify teacher
    await Notification.create({
      recipient: warning.teacher,
      sender: req.user.id,
      title: '✅ Warning Acknowledged',
      message: `Student ${req.user.name} acknowledged warning: "${warning.category}". Note: "${note || 'Acknowledged'}"`,
      type: 'warning',
      link: '/teacher/warnings'
    });

    res.json({ success: true, message: 'Warning acknowledged', warning: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to acknowledge warning', error: err.message });
  }
};

// @desc    Resolve warning (Teacher)
// @route   PUT /api/warnings/:id/resolve
exports.resolveWarning = async (req, res) => {
  try {
    const updated = await Warning.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    res.json({ success: true, message: 'Warning marked as resolved', warning: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resolve warning', error: err.message });
  }
};
