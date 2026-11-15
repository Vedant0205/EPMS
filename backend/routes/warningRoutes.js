const express = require('express');
const router = express.Router();
const warningController = require('../controllers/warningController');
const { verifyToken, isTeacher, isStudent } = require('../middleware/auth');

router.use(verifyToken);

// Teacher endpoints
router.post('/', isTeacher, warningController.createWarning);
router.get('/teacher', isTeacher, warningController.getTeacherWarnings);
router.put('/:id/resolve', isTeacher, warningController.resolveWarning);

// Student endpoints
router.get('/my-warnings', isStudent, warningController.getMyWarnings);
router.put('/:id/acknowledge', isStudent, warningController.acknowledgeWarning);

module.exports = router;
