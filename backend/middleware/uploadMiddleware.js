const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const attendanceDir = path.join(uploadsDir, 'attendance');
const profilesDir = path.join(uploadsDir, 'profiles');

[uploadsDir, attendanceDir, profilesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for Attendance Photos
const attendanceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attendanceDir);
  },
  filename: (req, file, cb) => {
    const studentId = (req.body.student_id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `att_${studentId}_${timestamp}${ext}`);
  }
});

// Storage for Student Profile Photos
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const studentId = (req.body.student_id || 'student').replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `profile_${studentId}_${timestamp}${ext}`);
  }
});

// File filter: accept only jpeg, png, webp
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// 5MB limit
const limits = {
  fileSize: 5 * 1024 * 1024
};

const uploadAttendancePhoto = multer({
  storage: attendanceStorage,
  fileFilter,
  limits
}).single('face_photo');

const uploadProfilePhoto = multer({
  storage: profileStorage,
  fileFilter,
  limits
}).single('profile_photo');

module.exports = {
  uploadAttendancePhoto,
  uploadProfilePhoto
};

