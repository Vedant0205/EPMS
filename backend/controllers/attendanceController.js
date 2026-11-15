const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get attendance sheet for a specific course and date (Teacher)
// @route   GET /api/attendance/course/:courseId?date=YYYY-MM-DD
exports.getCourseAttendanceSheet = async (req, res) => {
  try {
    const { courseId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Get all enrolled students
    const enrollments = await Enrollment.find({ course: courseId });
    const studentIds = enrollments.map(e => String(e.student));

    // Get students data
    const allStudents = await User.find({ role: 'student' });
    const enrolledStudents = allStudents.filter(s => studentIds.includes(String(s._id)));

    // Get existing records for this date and course
    const existingRecords = await Attendance.find({ course: courseId, date });
    const recordMap = {};
    existingRecords.forEach(r => {
      recordMap[String(r.student)] = r;
    });

    const roster = enrolledStudents.map(student => {
      const record = recordMap[String(student._id)];
      return {
        studentId: student._id,
        identifier: student.identifier,
        name: student.name,
        email: student.email,
        status: record ? record.status : 'present', // default to present for quick marking
        remarks: record ? record.remarks : '',
        isSaved: !!record,
        recordId: record ? record._id : null
      };
    });

    res.json({
      success: true,
      course: { _id: course._id, title: course.title, code: course.code },
      date,
      roster,
      summary: {
        totalEnrolled: enrolledStudents.length,
        alreadyMarked: existingRecords.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance sheet', error: err.message });
  }
};

// @desc    Save/update bulk attendance records for course and date (Teacher)
// @route   POST /api/attendance/mark
exports.saveAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    if (!courseId || !date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Course ID, date, and attendance records are required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const savedRecords = [];
    for (const item of records) {
      const { studentId, status, remarks } = item;
      if (!studentId || !status) continue;

      // Prevent duplicate by checking { student, course, date }
      const existing = await Attendance.findOne({
        student: studentId,
        course: courseId,
        date
      });

      if (existing) {
        // Update existing record
        const updated = await Attendance.findByIdAndUpdate(
          existing._id,
          {
            status,
            remarks: remarks || '',
            markedBy: req.user.id
          },
          { new: true }
        );
        savedRecords.push(updated);
      } else {
        // Create new record
        const created = await Attendance.create({
          student: studentId,
          course: courseId,
          date,
          status,
          remarks: remarks || '',
          markedBy: req.user.id
        });
        savedRecords.push(created);
      }

      // If marked absent, send attendance notification alert to student
      if (status === 'absent') {
        await Notification.create({
          recipient: studentId,
          title: '⚠️ Attendance Alert',
          message: `You were marked absent in ${course.title} on ${date}. Please contact your instructor if this is an error.`,
          type: 'attendance',
          link: '/student/attendance'
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully saved attendance for ${savedRecords.length} students on ${date}.`,
      recordsCount: savedRecords.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save attendance', error: err.message });
  }
};

// @desc    Get student's personal attendance history and calendar data
// @route   GET /api/attendance/my-attendance
exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId, month, year } = req.query;

    const query = { student: studentId };
    if (courseId) {
      query.course = courseId;
    }

    const records = await Attendance.find(query);

    // Filter by month/year if supplied
    let filteredRecords = records;
    if (month && year) {
      const padMonth = String(month).padStart(2, '0');
      const prefix = `${year}-${padMonth}`;
      filteredRecords = records.filter(r => r.date.startsWith(prefix));
    }

    // Sort descending by date
    filteredRecords.sort((a, b) => b.date.localeCompare(a.date));

    // Calculate total stats
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;

    // Formula: (Present Days / Total Days) * 100
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Enrich records with course names
    const courses = await Course.find();
    const courseLookup = {};
    courses.forEach(c => {
      courseLookup[String(c._id)] = c.title;
    });

    const enrichedHistory = filteredRecords.map(r => ({
      _id: r._id,
      date: r.date,
      status: r.status,
      remarks: r.remarks,
      courseId: r.course,
      courseName: courseLookup[String(r.course)] || 'General Session'
    }));

    res.json({
      success: true,
      stats: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        attendancePercentage
      },
      history: enrichedHistory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch personal attendance', error: err.message });
  }
};

// @desc    Get attendance analytics for a specific student (Teacher viewing student profile)
// @route   GET /api/attendance/student/:studentId
exports.getStudentAttendanceDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({ student: studentId });
    records.sort((a, b) => b.date.localeCompare(a.date));

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    const courses = await Course.find();
    const courseLookup = {};
    courses.forEach(c => {
      courseLookup[String(c._id)] = c.title;
    });

    const enriched = records.map(r => ({
      ...r,
      courseName: courseLookup[String(r.course)] || 'Course'
    }));

    res.json({
      success: true,
      stats: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        attendancePercentage
      },
      records: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student attendance', error: err.message });
  }
};
