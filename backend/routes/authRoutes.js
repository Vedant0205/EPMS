const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/avatar', verifyToken, uploadAvatar.single('avatar'), authController.uploadAvatar);
router.delete('/avatar', verifyToken, authController.removeAvatar);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Institutional Password Change Workflow (By Request)
router.post('/password-request', (req, res, next) => {
  // Allow optional token attachment if present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, authController.requestPasswordChange);

router.get('/password-requests', (req, res, next) => {
  if (req.query.requestId) {
    return next();
  }
  return verifyToken(req, res, next);
}, authController.getPasswordRequests);

router.post('/password-requests/:id/approve', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, authController.approvePasswordRequest);

router.post('/password-requests/complete', authController.completePasswordChange);

module.exports = router;
