const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const SystemSettings = require('../models/SystemSettings');

// @desc    Get comprehensive analytics & reporting metrics
// @route   GET /api/reports/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    const students = await User.find({ role: 'student' });
    const courses = await Course.find();
    const enrollments = await Enrollment.find();
    let attendance = await Attendance.find();

    // Date filtering on attendance
    if (startDate) {
      attendance = attendance.filter(a => a.date >= startDate);
    }
    if (endDate) {
      attendance = attendance.filter(a => a.date <= endDate);
    }
    if (courseId) {
      attendance = attendance.filter(a => String(a.course) === String(courseId));
    }

    // 1. Course-wise completion breakdown
    const courseStats = courses.map(course => {
      const courseEnr = enrollments.filter(e => String(e.course) === String(course._id));
      const totalEnrolled = courseEnr.length;
      const completedCount = courseEnr.filter(e => e.completionPercentage >= 100).length;
      const avgCompletion = totalEnrolled > 0
        ? Math.round(courseEnr.reduce((a, b) => a + (b.completionPercentage || 0), 0) / totalEnrolled)
        : 0;

      const courseAtt = attendance.filter(a => String(a.course) === String(course._id));
      const presentCount = courseAtt.filter(a => a.status === 'present').length;
      const avgAttendance = courseAtt.length > 0 ? Math.round((presentCount / courseAtt.length) * 100) : 0;

      return {
        courseId: course._id,
        courseName: course.title,
        code: course.code,
        totalEnrolled,
        completedCount,
        avgCompletion,
        avgAttendance
      };
    });

    // 2. Monthly Attendance Trends (aggregate by YYYY-MM or last 6 months)
    const monthlyMap = {};
    attendance.forEach(a => {
      const monthKey = a.date.substring(0, 7); // e.g. "2026-10", "2026-11"
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, total: 0, present: 0, absent: 0, leave: 0 };
      }
      monthlyMap[monthKey].total++;
      if (a.status === 'present') monthlyMap[monthKey].present++;
      else if (a.status === 'absent') monthlyMap[monthKey].absent++;
      else if (a.status === 'leave') monthlyMap[monthKey].leave++;
    });

    const monthlyTrends = Object.keys(monthlyMap).sort().map(m => {
      const item = monthlyMap[m];
      const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
      return {
        month: item.month,
        attendanceRate: rate,
        present: item.present,
        absent: item.absent,
        leave: item.leave,
        totalSessions: item.total
      };
    });

    // 3. Student Progress Distribution brackets
    let bracket0_25 = 0;
    let bracket26_50 = 0;
    let bracket51_75 = 0;
    let bracket76_100 = 0;

    for (const student of students) {
      const studentEnr = enrollments.filter(e => String(e.student) === String(student._id));
      const avg = studentEnr.length > 0
        ? Math.round(studentEnr.reduce((a, b) => a + (b.completionPercentage || 0), 0) / studentEnr.length)
        : 0;

      if (avg <= 25) bracket0_25++;
      else if (avg <= 50) bracket26_50++;
      else if (avg <= 75) bracket51_75++;
      else bracket76_100++;
    }

    const progressDistribution = [
      { range: '0-25%', count: bracket0_25, fill: '#ef4444' },
      { range: '26-50%', count: bracket26_50, fill: '#f59e0b' },
      { range: '51-75%', count: bracket51_75, fill: '#3b82f6' },
      { range: '76-100%', count: bracket76_100, fill: '#10b981' }
    ];

    // 4. At-Risk Student Summary
    const settingsDoc = (await SystemSettings.findOne()) || {
      attendanceThreshold: 75,
      completionThreshold: 40,
      inactivityDaysThreshold: 7
    };

    let atRiskList = [];
    const now = new Date();

    for (const s of students) {
      const sAtt = attendance.filter(a => String(a.student) === String(s._id));
      const sPresent = sAtt.filter(a => a.status === 'present').length;
      const attPct = sAtt.length > 0 ? Math.round((sPresent / sAtt.length) * 100) : 100;

      const sEnr = enrollments.filter(e => String(e.student) === String(s._id));
      const compPct = sEnr.length > 0
        ? Math.round(sEnr.reduce((a, b) => a + (b.completionPercentage || 0), 0) / sEnr.length)
        : 0;

      const lastDate = s.lastActive ? new Date(s.lastActive) : new Date(s.createdAt);
      const daysInactive = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));

      if (attPct < settingsDoc.attendanceThreshold || compPct < settingsDoc.completionThreshold || daysInactive >= settingsDoc.inactivityDaysThreshold) {
        atRiskList.push({
          studentId: s._id,
          name: s.name,
          identifier: s.identifier,
          attendancePercentage: attPct,
          courseCompletionPercentage: compPct,
          daysInactive
        });
      }
    }

    res.json({
      success: true,
      courseStats,
      monthlyTrends,
      progressDistribution,
      atRiskCount: atRiskList.length,
      atRiskList,
      totalStudents: students.length,
      totalCourses: courses.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate report analytics', error: err.message });
  }
};

// @desc    Export performance report data as CSV format
// @route   GET /api/reports/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    const enrollments = await Enrollment.find();
    const attendance = await Attendance.find();
    const settingsDoc = (await SystemSettings.findOne()) || {
      attendanceThreshold: 75,
      completionThreshold: 40,
      inactivityDaysThreshold: 7
    };

    let csv = 'Student ID,Full Name,Email,Department,Attendance %,Completed Courses,Average Progress %,Status,Last Active\n';

    for (const s of students) {
      const sAtt = attendance.filter(a => String(a.student) === String(s._id));
      const presentCount = sAtt.filter(a => a.status === 'present').length;
      const attPct = sAtt.length > 0 ? Math.round((presentCount / sAtt.length) * 100) : 100;

      const sEnr = enrollments.filter(e => String(e.student) === String(s._id));
      const completedCourses = sEnr.filter(e => e.completionPercentage >= 100).length;
      const avgProg = sEnr.length > 0
        ? Math.round(sEnr.reduce((a, b) => a + (b.completionPercentage || 0), 0) / sEnr.length)
        : 0;

      let status = 'On Track';
      if (attPct < settingsDoc.attendanceThreshold || avgProg < settingsDoc.completionThreshold) {
        status = 'At Risk';
      } else if (attPct < settingsDoc.attendanceThreshold + 7 || avgProg < settingsDoc.completionThreshold + 15) {
        status = 'Needs Attention';
      }

      const lastActiveStr = s.lastActive ? new Date(s.lastActive).toISOString().split('T')[0] : 'N/A';

      csv += `"${s.identifier}","${s.name}","${s.email}","${s.department || 'CS'}","${attPct}%","${completedCourses}/${sEnr.length}","${avgProg}%","${status}","${lastActiveStr}"\n`;
    }

    res.header('Content-Type', 'text/csv');
    res.attachment('EPMS_Student_Performance_Report.csv');
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export CSV', error: err.message });
  }
};
