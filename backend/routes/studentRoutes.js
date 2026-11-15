const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, isStudent } = require('../middleware/auth');

router.use(verifyToken);
router.use(isStudent);

router.get('/dashboard', studentController.getStudentDashboard);

module.exports = router;
