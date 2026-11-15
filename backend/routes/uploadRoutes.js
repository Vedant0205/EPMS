const express = require('express');
const router = express.Router();
const { uploadThumbnail, uploadVideo } = require('../middleware/upload');
const { verifyToken, isTeacher } = require('../middleware/auth');

router.use(verifyToken);
router.use(isTeacher);

router.post('/thumbnail', uploadThumbnail.single('thumbnail'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/thumbnails/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Thumbnail uploaded successfully',
    url: fileUrl,
    filename: req.file.filename
  });
});

router.post('/video', uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Video uploaded successfully',
    url: fileUrl,
    filename: req.file.filename
  });
});

module.exports = router;
