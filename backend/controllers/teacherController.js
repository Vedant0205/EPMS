const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const LessonProgress = require('../models/LessonProgress');
const Warning = require('../models/Warning');
const SystemSettings = require('../models/SystemSettings');

// Helper to determine risk status based on configurable thresholds
function computeRiskStatus(attendancePct, completionPct, daysInactive, thresholds) {
  const {
    attendanceThreshold = 75,
    completionThreshold = 40,
    inactivityDaysThreshold = 7
  } = thresholds;

  const isAttendanceRisk = attendancePct < attendanceThreshold;
  const isCompletionRisk = completionPct < completionThreshold;
  const isInactiveRisk = daysInactive >= inactivityDaysThreshold;

  if (isAttendanceRisk || isCompletionRisk || isInactiveRisk) {
    const reasons = [];
    if (isAttendanceRisk) reasons.push(`Attendance below ${attendanceThreshold}% (${attendancePct}%)`);
    if (isCompletionRisk) reasons.push(`Course completion below ${completionThreshold}% (${completionPct}%)`);
    if (isInactiveRisk) reasons.push(`Inactive for ${daysInactive} days (threshold: ${inactivityDaysThreshold})`);

    return {
      status: 'At Risk',
      color: 'red',
      reasons,
      badgeClass: 'bg-red-100 text-red-700 border-red-200'
    };
  }

  // Warning zone: attendance between 75-80% or completion between 40-60% or inactive 4-6 days
  const isAttendanceWarning = attendancePct >= attendanceThreshold && attendancePct < attendanceThreshold + 7;
  const isCompletionWarning = completionPct >= completionThreshold && completionPct < completionThreshold + 15;
  const isInactiveWarning = daysInactive >= Math.max(3, inactivityDaysThreshold - 3);

  if (isAttendanceWarning || isCompletionWarning || isInactiveWarning) {
    const reasons = [];
    if (isAttendanceWarning) reasons.push(`Attendance near threshold (${attendancePct}%)`);
    if (isCompletionWarning) reasons.push(`Completion progress slow (${completionPct}%)`);
    if (isInactiveWarning) reasons.push(`Inactive for ${daysInactive} days`);

    return {
      status: 'Needs Attention',
      color: 'amber',
      reasons,
      badgeClass: 'bg-amber-100 text-amber-700 border-amber-200'
    };
  }

  return {
    status: 'On Track',
    color: 'emerald',
    reasons: ['Consistently meeting academic milestones'],
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };
}

// @desc    Teacher Dashboard Overview
// @route   GET /api/teacher/dashboard
exports.getTeacherDashboard = async (req, res) => {
  try {
    const settingsDoc = (await SystemSettings.findOne()) || {
      attendanceThreshold: 75,
      completionThreshold: 40,
      inactivityDaysThreshold: 7
    };

    const students = await User.find({ role: 'student' });
    const courses = await Course.find();
    const enrollments = await Enrollment.find();
    const attendanceRecords = await Attendance.find();

    const now = new Date();

    // Compute metrics for all students
    let totalAttendanceSum = 0;
    let totalCompletionSum = 0;
    let atRiskCount = 0;
    let needsAttentionCount = 0;
    let onTrackCount = 0;

    const studentMetrics = [];

    for (const student of students) {
      // 1. Attendance
      const studentAtt = attendanceRecords.filter(r => String(r.student) === String(student._id));
      const totalDays = studentAtt.length;
      const presentDays = studentAtt.filter(r => r.status === 'present').length;
      const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
      totalAttendanceSum += attendancePct;

      // 2. Course completion
      const studentEnr = enrollments.filter(e => String(e.student) === String(student._id));
      const avgCompletion = studentEnr.length > 0
        ? Math.round(studentEnr.reduce((a, b) => a + (b.completionPercentage || 0), 0) / studentEnr.length)
        : 0;
      totalCompletionSum += avgCompletion;

      // 3. Inactivity
      const lastActiveDate = student.lastActive ? new Date(student.lastActive) : new Date(student.createdAt);
      const daysInactive = Math.max(0, Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24)));

      // 4. Status
      const riskInfo = computeRiskStatus(attendancePct, avgCompletion, daysInactive, settingsDoc);
      if (riskInfo.status === 'At Risk') atRiskCount++;
      else if (riskInfo.status === 'Needs Attention') needsAttentionCount++;
      else onTrackCount++;

      const completedCoursesCount = studentEnr.filter(e => (e.completionPercentage || 0) >= 100 || e.status === 'completed').length;

      studentMetrics.push({
        _id: student._id,
        name: student.name,
        identifier: student.identifier,
        email: student.email,
        department: student.department,
        avatar: student.avatar,
        attendancePercentage: attendancePct,
        courseCompletionPercentage: avgCompletion,
        averageProgress: avgCompletion,
        completedCourses: completedCoursesCount,
        enrolledCount: studentEnr.length,
        daysInactive,
        lastActive: student.lastActive,
        risk: riskInfo
      });
    }

    const totalStudents = students.length;
    const avgAttendance = totalStudents > 0 ? Math.round(totalAttendanceSum / totalStudents) : 0;
    const avgCompletion = totalStudents > 0 ? Math.round(totalCompletionSum / totalStudents) : 0;

    // Recent warnings
    const recentWarnings = await Warning.find();
    recentWarnings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Distribution for charts
    const statusDistribution = [
      { name: 'On Track', count: onTrackCount, fill: '#10b981' },
      { name: 'Needs Attention', count: needsAttentionCount, fill: '#f59e0b' },
      { name: 'At Risk', count: atRiskCount, fill: '#ef4444' }
    ];

    res.json({
      success: true,
      overview: {
        totalStudents,
        totalCourses: courses.length,
        averageAttendance: avgAttendance,
        averageCourseCompletion: avgCompletion,
        studentsAtRisk: atRiskCount,
        studentsNeedsAttention: needsAttentionCount,
        studentsOnTrack: onTrackCount
      },
      statusDistribution,
      atRiskStudentsList: studentMetrics.filter(s => s.risk.status === 'At Risk'),
      recentWarnings: recentWarnings.slice(0, 5),
      settings: settingsDoc
    });
  } catch (err) {
    console.error('Teacher Dashboard Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch teacher dashboard data', error: err.message });
  }
};

// @desc    Get filtered list of students with comprehensive performance metrics
// @route   GET /api/teacher/students
exports.getStudentsList = async (req, res) => {
  try {
    const { search, courseId, attendanceFilter, progressFilter, riskStatus } = req.query;

    const settingsDoc = (await SystemSettings.findOne()) || {
      attendanceThreshold: 75,
      completionThreshold: 40,
      inactivityDaysThreshold: 7
    };

    const students = await User.find({ role: 'student' });
    const enrollments = await Enrollment.find();
    const attendanceRecords = await Attendance.find();
    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => {
      courseMap[String(c._id)] = c.title;
    });

    const now = new Date();
    let list = [];

    for (const student of students) {
      // Enrollments
      let studentEnr = enrollments.filter(e => String(e.student) === String(student._id));

      if (courseId && !studentEnr.some(e => String(e.course) === String(courseId))) {
        continue;
      }

      const enrolledCourseNames = studentEnr.map(e => courseMap[String(e.course)] || 'Course');
      const avgCompletion = studentEnr.length > 0
        ? Math.round(studentEnr.reduce((a, b) => a + (b.completionPercentage || 0), 0) / studentEnr.length)
        : 0;

      // Attendance
      let studentAtt = attendanceRecords.filter(r => String(r.student) === String(student._id));
      if (courseId) {
        studentAtt = studentAtt.filter(r => String(r.course) === String(courseId));
      }
      const totalDays = studentAtt.length;
      const presentDays = studentAtt.filter(r => r.status === 'present').length;
      const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      // Inactivity
      const lastActiveDate = student.lastActive ? new Date(student.lastActive) : new Date(student.createdAt);
      const daysInactive = Math.max(0, Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24)));

      // Risk computation
      const risk = computeRiskStatus(attendancePct, avgCompletion, daysInactive, settingsDoc);

      const completedCourses = studentEnr.filter(e => (e.completionPercentage || 0) >= 100 || e.status === 'completed').length;

      list.push({
        _id: student._id,
        name: student.name,
        identifier: student.identifier,
        email: student.email,
        department: student.department,
        avatar: student.avatar,
        lastActive: student.lastActive,
        daysInactive,
        enrolledCourses: enrolledCourseNames,
        enrolledCount: studentEnr.length,
        attendancePercentage: attendancePct,
        totalAttendanceDays: totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        courseCompletionPercentage: avgCompletion,
        averageProgress: avgCompletion,
        completedCourses,
        risk
      });
    }

    // Apply Filters:
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.identifier.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    if (attendanceFilter) {
      if (attendanceFilter === 'low') list = list.filter(s => s.attendancePercentage < 75);
      else if (attendanceFilter === 'good') list = list.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 90);
      else if (attendanceFilter === 'excellent') list = list.filter(s => s.attendancePercentage >= 90);
    }

    if (progressFilter) {
      if (progressFilter === 'low') list = list.filter(s => s.courseCompletionPercentage < 40);
      else if (progressFilter === 'medium') list = list.filter(s => s.courseCompletionPercentage >= 40 && s.courseCompletionPercentage < 70);
      else if (progressFilter === 'high') list = list.filter(s => s.courseCompletionPercentage >= 70);
    }

    if (riskStatus) {
      list = list.filter(s => s.risk.status.toLowerCase() === riskStatus.toLowerCase());
    }

    res.json({
      success: true,
      totalCount: list.length,
      students: list
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student management list', error: err.message });
  }
};

// @desc    Get individual student detailed profile & comparison metrics
// @route   GET /api/teacher/students/:studentId
exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.params.id;
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const settingsDoc = (await SystemSettings.findOne()) || {
      attendanceThreshold: 75,
      completionThreshold: 40,
      inactivityDaysThreshold: 7
    };

    // Enrollments & detailed course progress
    const enrollments = await Enrollment.find({ student: studentId });
    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => {
      courseMap[String(c._id)] = c;
    });

    const detailedCourses = [];
    for (const enr of enrollments) {
      const course = courseMap[String(enr.course)];
      if (!course) continue;

      const lessons = await Lesson.find({ course: course._id });
      const progresses = await LessonProgress.find({ student: studentId, course: course._id });
      const completedLessons = progresses.filter(p => p.completed).length;

      detailedCourses.push({
        courseId: course._id,
        title: course.title,
        code: course.code,
        thumbnail: course.thumbnail,
        totalLessons: lessons.length,
        completedLessons,
        pendingLessons: Math.max(0, lessons.length - completedLessons),
        completionPercentage: enr.completionPercentage,
        status: enr.status,
        lastAccessed: enr.lastAccessed
      });
    }

    // Attendance breakdown
    const attendanceRecords = await Attendance.find({ student: studentId });
    attendanceRecords.sort((a, b) => b.date.localeCompare(a.date));

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const leaveDays = attendanceRecords.filter(r => r.status === 'leave').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Video watch activity
    const videoProgress = await LessonProgress.find({ student: studentId });
    const totalWatchedSeconds = videoProgress.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);

    // Days inactive
    const now = new Date();
    const lastActiveDate = student.lastActive ? new Date(student.lastActive) : new Date(student.createdAt);
    const daysInactive = Math.max(0, Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24)));

    // Overall completion average
    const avgCompletion = detailedCourses.length > 0
      ? Math.round(detailedCourses.reduce((a, b) => a + (b.completionPercentage || 0), 0) / detailedCourses.length)
      : 0;

    const risk = computeRiskStatus(attendancePercentage, avgCompletion, daysInactive, settingsDoc);

    // Warnings issued to this student
    const warnings = await Warning.find({ student: studentId });
    warnings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Cohort Benchmark Comparisons
    const allStudents = await User.find({ role: 'student' });
    const allEnrollments = await Enrollment.find();
    const allAttendance = await Attendance.find();

    const cohortAvgAttendance = allAttendance.length > 0
      ? Math.round((allAttendance.filter(r => r.status === 'present').length / allAttendance.length) * 100)
      : 80;

    const cohortAvgCompletion = allEnrollments.length > 0
      ? Math.round(allEnrollments.reduce((a, b) => a + (b.completionPercentage || 0), 0) / allEnrollments.length)
      : 55;

    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        identifier: student.identifier,
        email: student.email,
        department: student.department,
        avatar: student.avatar,
        phone: student.phone,
        lastActive: student.lastActive,
        daysInactive,
        createdAt: student.createdAt
      },
      metrics: {
        attendancePercentage,
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        averageCompletion: avgCompletion,
        totalWatchedMinutes: Math.round(totalWatchedSeconds / 60),
        risk
      },
      benchmarkComparison: {
        studentAttendance: attendancePercentage,
        cohortAvgAttendance,
        studentCompletion: avgCompletion,
        cohortAvgCompletion
      },
      courses: detailedCourses,
      recentAttendance: attendanceRecords.slice(0, 15),
      warnings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student profile', error: err.message });
  }
};

// @desc    Get & Update Risk & Monitoring System Settings
// @route   GET /api/teacher/settings
// @route   PUT /api/teacher/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        attendanceThreshold: 75,
        completionThreshold: 40,
        inactivityDaysThreshold: 7,
        institutionName: 'Educational Progress Monitoring System (EPMS)'
      });
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings', error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { attendanceThreshold, completionThreshold, inactivityDaysThreshold, institutionName } = req.body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        attendanceThreshold: Number(attendanceThreshold) || 75,
        completionThreshold: Number(completionThreshold) || 40,
        inactivityDaysThreshold: Number(inactivityDaysThreshold) || 7,
        institutionName: institutionName || 'EPMS Institution',
        updatedBy: req.user.id
      });
    } else {
      settings = await SystemSettings.findByIdAndUpdate(
        settings._id,
        {
          attendanceThreshold: Number(attendanceThreshold) || settings.attendanceThreshold,
          completionThreshold: Number(completionThreshold) || settings.completionThreshold,
          inactivityDaysThreshold: Number(inactivityDaysThreshold) || settings.inactivityDaysThreshold,
          institutionName: institutionName || settings.institutionName,
          updatedBy: req.user.id
        },
        { new: true }
      );
    }

    res.json({ success: true, message: 'Monitoring thresholds updated successfully', settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings', error: err.message });
  }
};
