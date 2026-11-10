const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { uploadAttendancePhoto } = require('../middleware/uploadMiddleware');

// Route to submit student attendance (with face photo)
router.post('/', uploadAttendancePhoto, attendanceController.submitAttendance);

// Route to get today's attendance records
router.get('/today', attendanceController.getTodayAttendance);

// Route to get attendance history for a student
router.get('/student/:studentId', attendanceController.getStudentAttendanceHistory);

// Route to export attendance as CSV
router.get('/export/csv', attendanceController.exportAttendanceCSV);

// Route to reset attendance records for testing
router.delete('/reset', attendanceController.resetAttendance);

// Route to get all attendance records with query filters
router.get('/', attendanceController.getAllAttendance);

module.exports = router;

