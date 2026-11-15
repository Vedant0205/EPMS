const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { verifyToken, isTeacher, isStudent } = require('../middleware/auth');

router.use(verifyToken);

router.get('/:id', lessonController.getLesson);
router.post('/:id/heartbeat', isStudent, lessonController.updateWatchProgress);
router.post('/:id/complete', isStudent, lessonController.markLessonCompleted);

// Teacher lesson management
router.post('/', isTeacher, lessonController.createLesson);
router.put('/:id', isTeacher, lessonController.updateLesson);
router.delete('/:id', isTeacher, lessonController.deleteLesson);

module.exports = router;
