const { query } = require('../config/db');

// GET /api/students/:studentId
async function getStudentById(req, res, next) {
  try {
    const { studentId } = req.params;

    if (!studentId || !studentId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student ID Card Number is required.'
      });
    }

    // Query student by student_id (case-insensitive trim)
    const trimmedId = studentId.trim();
    const studentResult = await query(
      'SELECT id, student_id, full_name, class_name, profile_photo, created_at FROM students WHERE UPPER(student_id) = UPPER($1)',
      [trimmedId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student ID Not Found. Please Check Your Student ID Card.'
      });
    }

    const student = studentResult.rows[0];

    // Check if attendance already marked today
    const todayResult = await query(
      'SELECT id, student_id, attendance_date, attendance_time, face_photo, status, created_at FROM attendance WHERE student_id = $1 AND attendance_date = CURRENT_DATE',
      [student.student_id]
    );

    const alreadySubmitted = todayResult.rows.length > 0;
    const todayAttendance = alreadySubmitted ? todayResult.rows[0] : null;

    return res.status(200).json({
      success: true,
      student,
      already_submitted_today: alreadySubmitted,
      today_attendance: todayAttendance
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/students/by-class (Grouped by Class Directory)
async function getStudentsGroupedByClass(req, res, next) {
  try {
    const classesRes = await query('SELECT class_name, description FROM classes ORDER BY class_name ASC');
    const studentsRes = await query('SELECT id, student_id, full_name, class_name, profile_photo FROM students ORDER BY full_name ASC');

    const classMap = {};
    classesRes.rows.forEach(c => {
      classMap[c.class_name] = {
        class_name: c.class_name,
        description: c.description,
        students: []
      };
    });

    studentsRes.rows.forEach(s => {
      if (!classMap[s.class_name]) {
        classMap[s.class_name] = {
          class_name: s.class_name,
          description: '',
          students: []
        };
      }
      classMap[s.class_name].students.push(s);
    });

    const result = Object.values(classMap);

    return res.status(200).json({
      success: true,
      count: result.length,
      classes: result
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/students
async function getAllStudents(req, res, next) {
  try {
    const { search, class_name } = req.query;

    let sql = `
      SELECT s.id, s.student_id, s.full_name, s.class_name, s.profile_photo, s.created_at,
             COUNT(a.id)::int as total_attendances
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (s.student_id ILIKE $${params.length} OR s.full_name ILIKE $${params.length})`;
    }

    if (class_name && class_name.trim() && class_name !== 'All') {
      params.push(class_name.trim());
      sql += ` AND s.class_name = $${params.length}`;
    }

    sql += ' GROUP BY s.id, s.student_id, s.full_name, s.class_name, s.profile_photo, s.created_at ORDER BY s.student_id ASC';

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      students: result.rows
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/students
async function createStudent(req, res, next) {
  try {
    const { student_id, full_name, class_name } = req.body;

    if (!student_id || !full_name || !class_name) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Full Name, and Class Name are required.'
      });
    }

    const trimmedId = student_id.trim().toUpperCase();

    // Check duplicate student_id
    const existing = await query('SELECT id FROM students WHERE UPPER(student_id) = $1', [trimmedId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Student ID "${trimmedId}" already exists.`
      });
    }

    // Determine profile photo path
    let profilePhotoPath = null;
    if (req.file) {
      profilePhotoPath = `/uploads/profiles/${req.file.filename}`;
    } else {
      profilePhotoPath = '/uploads/profiles/default.svg';
    }

    // Ensure class exists in classes table
    const trimmedClass = class_name.trim();
    await query('INSERT INTO classes (class_name) VALUES ($1) ON CONFLICT (class_name) DO NOTHING', [trimmedClass]);

    const result = await query(
      `INSERT INTO students (student_id, full_name, class_name, profile_photo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trimmedId, full_name.trim(), trimmedClass, profilePhotoPath]
    );

    return res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      student: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/students/:id
async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { student_id, full_name, class_name } = req.body;

    const existingStudent = await query('SELECT * FROM students WHERE id = $1', [id]);
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const current = existingStudent.rows[0];
    const newStudentId = student_id ? student_id.trim().toUpperCase() : current.student_id;
    const newFullName = full_name ? full_name.trim() : current.full_name;
    const newClassName = class_name ? class_name.trim() : current.class_name;
    let newProfilePhoto = current.profile_photo;

    if (req.file) {
      newProfilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    // If student_id changed, check uniqueness
    if (newStudentId !== current.student_id) {
      const duplicate = await query('SELECT id FROM students WHERE UPPER(student_id) = $1 AND id != $2', [newStudentId, id]);
      if (duplicate.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Student ID "${newStudentId}" already in use.`
        });
      }
    }

    const result = await query(
      `UPDATE students 
       SET student_id = $1, full_name = $2, class_name = $3, profile_photo = $4
       WHERE id = $5
       RETURNING *`,
      [newStudentId, newFullName, newClassName, newProfilePhoto, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully.',
      student: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/students/:id
async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student and related attendance records deleted successfully.',
      deleted_student: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudentById,
  getAllStudents,
  getStudentsGroupedByClass,
  createStudent,
  updateStudent,
  deleteStudent
};

