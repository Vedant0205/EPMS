const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, isTeacher } = require('../middleware/auth');

router.get('/', verifyToken, courseController.getCourses);
router.get('/:id', verifyToken, courseController.getCourseById);

// Teacher-only course management
router.post('/', verifyToken, isTeacher, courseController.createCourse);
router.put('/:id', verifyToken, isTeacher, courseController.updateCourse);
router.delete('/:id', verifyToken, isTeacher, courseController.deleteCourse);
router.post('/:id/enroll', verifyToken, courseController.enrollStudent);

module.exports = router;
