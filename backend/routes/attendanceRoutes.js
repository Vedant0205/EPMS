const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, isTeacher, isStudent } = require('../middleware/auth');

router.use(verifyToken);

// Student personal attendance
router.get('/my-attendance', isStudent, attendanceController.getMyAttendance);

// Teacher attendance management
router.get('/course/:courseId', isTeacher, attendanceController.getCourseAttendanceSheet);
router.post('/mark', isTeacher, attendanceController.saveAttendance);
router.get('/student/:studentId', isTeacher, attendanceController.getStudentAttendanceDetails);

module.exports = router;
