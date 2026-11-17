const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '..', 'uploads', 'thumbnails'),
    path.join(__dirname, '..', 'uploads', 'videos'),
    path.join(__dirname, '..', 'uploads', 'avatars')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};
createUploadDirs();

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'thumbnails'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'thumb-' + uniqueSuffix + ext);
  }
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'videos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + uniqueSuffix + ext);
  }
});

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|svg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, WEBP, SVG) are allowed!'));
};

const videoFilter = (req, file, cb) => {
  const allowed = /mp4|webm|mkv|mov/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ext || file.mimetype.startsWith('video/')) {
    return cb(null, true);
  }
  cb(new Error('Only video files (MP4, WEBM, MKV, MOV) are allowed!'));
};

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: imageFilter
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
  fileFilter: videoFilter
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: imageFilter
});

module.exports = { uploadThumbnail, uploadVideo, uploadAvatar };
