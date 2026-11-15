const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const LessonProgress = require('../models/LessonProgress');
const Warning = require('../models/Warning');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');

// @desc    Get complete student dashboard data
// @route   GET /api/student/dashboard
exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. Enrollments
    const enrollments = await Enrollment.find({ student: studentId });
    const totalEnrolled = enrollments.length;
    const completedCoursesCount = enrollments.filter(e => e.status === 'completed' || e.completionPercentage >= 100).length;
    const inProgressCoursesCount = totalEnrolled - completedCoursesCount;

    // Overall learning progress = average of completionPercentage
    const overallProgress = totalEnrolled > 0
      ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.completionPercentage || 0), 0) / totalEnrolled)
      : 0;

    // 2. Attendance Stats
    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalAttendanceDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const leaveDays = attendanceRecords.filter(r => r.status === 'leave').length;
    const attendancePercentage = totalAttendanceDays > 0
      ? Math.round((presentDays / totalAttendanceDays) * 100)
      : 100;

    // 3. Course Progress Details
    const courseIds = enrollments.map(e => e.course);
    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => {
      courseMap[String(c._id)] = c;
    });

    const enrolledCourseDetails = [];
    for (const enr of enrollments) {
      const course = courseMap[String(enr.course)];
      if (!course) continue;

      let lessons = await Lesson.find({ course: course._id });
      if (Array.isArray(lessons)) {
        lessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
      } else if (lessons && typeof lessons.sort === 'function') {
        lessons = await lessons.sort({ order: 1 });
      }

      const progresses = await LessonProgress.find({ student: studentId, course: course._id });
      const completedSet = new Set(progresses.filter(p => p.completed).map(p => String(p.lesson)));

      const nextLesson = lessons.find(l => !completedSet.has(String(l._id))) || lessons[0];

      enrolledCourseDetails.push({
        enrollmentId: enr._id,
        courseId: course._id,
        title: course.title,
        code: course.code,
        thumbnail: course.thumbnail,
        instructorName: course.teacherName || 'Faculty Instructor',
        totalLessons: lessons.length,
        completedLessons: completedSet.size,
        completionPercentage: enr.completionPercentage || (lessons.length > 0 ? Math.round((completedSet.size / lessons.length) * 100) : 0),
        status: enr.status,
        lastAccessed: enr.lastAccessed,
        continueLessonId: nextLesson ? nextLesson._id : null
      });
    }

    // 4. Learning Activity
    // Recently watched or completed
    const allProgresses = await LessonProgress.find({ student: studentId });
    allProgresses.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    const lessonsAll = await Lesson.find();
    const lessonMap = {};
    lessonsAll.forEach(l => {
      lessonMap[String(l._id)] = l;
    });

    const recentActivities = allProgresses.slice(0, 5).map(p => {
      const lesson = lessonMap[String(p.lesson)];
      const course = lesson ? courseMap[String(lesson.course)] : null;
      return {
        _id: p._id,
        lessonId: p.lesson,
        lessonTitle: lesson ? lesson.title : 'Lesson',
        courseTitle: course ? course.title : 'Course',
        courseId: lesson ? lesson.course : null,
        completed: p.completed,
        watchedSeconds: p.watchedSeconds || 0,
        lastPositionSeconds: p.lastPositionSeconds || 0,
        updatedAt: p.updatedAt || p.createdAt
      };
    });

    // Upcoming / Pending lessons
    const pendingLessons = [];
    for (const enr of enrolledCourseDetails) {
      if (enr.completionPercentage < 100 && enr.continueLessonId) {
        const nextL = lessonMap[String(enr.continueLessonId)];
        if (nextL) {
          pendingLessons.push({
            lessonId: nextL._id,
            title: nextL.title,
            courseTitle: enr.title,
            courseId: enr.courseId,
            duration: nextL.duration
          });
        }
      }
    }

    // 5. Active Warnings & Notifications
    const activeWarnings = await Warning.find({ student: studentId, status: { $ne: 'resolved' } });
    const notifications = await Notification.find({ recipient: studentId });
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unreadNotifications = notifications.filter(n => !n.isRead);

    // 6. Announcements
    const announcements = await Announcement.find();
    announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      overview: {
        totalEnrolled,
        completedCoursesCount,
        inProgressCoursesCount,
        attendancePercentage,
        overallProgress,
        totalAttendanceDays,
        presentDays,
        absentDays,
        leaveDays,
        activeWarningsCount: activeWarnings.length,
        unreadNotificationsCount: unreadNotifications.length
      },
      enrolledCourses: enrolledCourseDetails,
      recentActivities,
      pendingLessons: pendingLessons.slice(0, 5),
      warnings: activeWarnings,
      notifications: notifications.slice(0, 6),
      announcements: announcements.slice(0, 3)
    });
  } catch (err) {
    console.error('Student Dashboard Error:', err);
    res.status(500).json({ success: false, message: 'Failed to load student dashboard', error: err.message });
  }
};
