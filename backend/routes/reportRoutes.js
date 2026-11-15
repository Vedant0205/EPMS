const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, isTeacher } = require('../middleware/auth');

router.use(verifyToken);
router.use(isTeacher);

router.get('/analytics', reportController.getAnalytics);
router.get('/export/csv', reportController.exportCSV);

module.exports = router;
