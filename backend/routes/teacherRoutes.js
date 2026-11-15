const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, isTeacher } = require('../middleware/auth');

router.use(verifyToken);
router.use(isTeacher);

router.get('/dashboard', teacherController.getTeacherDashboard);
router.get('/students', teacherController.getStudentsList);
router.get('/students/:studentId', teacherController.getStudentProfile);
router.get('/settings', teacherController.getSettings);
router.put('/settings', teacherController.updateSettings);

module.exports = router;
