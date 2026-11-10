const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_APIKEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_APISECRET || process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

async function uploadAttendanceImage(filePath, studentId) {
  if (!isCloudinaryConfigured) {
    console.warn('Cloudinary credentials not detected, using local storage fallback.');
    return null;
  }

  const cleanStudentId = (studentId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
  const publicId = `att_${cleanStudentId}_${Date.now()}`;

  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'attendance_image',
    public_id: publicId,
    resource_type: 'image',
    transformation: [
      { width: 1280, height: 720, crop: 'limit' },
      { quality: 'auto' }
    ]
  });

  return result.secure_url;
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadAttendanceImage
};

