const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { uploadProfilePhoto } = require('../middleware/uploadMiddleware');

// Route to get students grouped by class (for student directory lookup)
router.get('/by-class', studentController.getStudentsGroupedByClass);

// Route to get student by student ID card number
router.get('/:studentId', studentController.getStudentById);

// Route to get all students
router.get('/', studentController.getAllStudents);

// Route to create a student (with profile photo upload)
router.post('/', uploadProfilePhoto, studentController.createStudent);

// Route to update a student
router.put('/:id', uploadProfilePhoto, studentController.updateStudent);

// Route to delete a student
router.delete('/:id', studentController.deleteStudent);

module.exports = router;

