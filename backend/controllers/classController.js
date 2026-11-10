const { query } = require('../config/db');

// GET /api/classes
async function getAllClasses(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        c.id, 
        c.class_name, 
        c.description, 
        COALESCE(c.study_time, '08:00 AM - 11:30 AM') AS study_time,
        c.created_at,
        COUNT(DISTINCT s.id)::int as total_students,
        COUNT(DISTINCT a.id)::int as present_today,
        COUNT(DISTINCT CASE WHEN a.status = 'Late' THEN a.id END)::int as late_today
      FROM classes c
      LEFT JOIN students s ON c.class_name = s.class_name
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.attendance_date = CURRENT_DATE
      GROUP BY c.id, c.class_name, c.description, c.study_time, c.created_at
      ORDER BY c.class_name ASC
    `);

    const classesWithStats = result.rows.map(c => {
      const total = c.total_students || 0;
      const present = c.present_today || 0;
      const late = c.late_today || 0;
      const absent = Math.max(0, total - present);
      const rate = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;
      return {
        ...c,
        absent_today: absent,
        attendance_rate: rate
      };
    });

    return res.status(200).json({
      success: true,
      count: classesWithStats.length,
      classes: classesWithStats
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/classes/:className/attendance (Classroom view with All, Present, and Absent students)
async function getClassAttendance(req, res, next) {
  try {
    const { className } = req.params;
    const { date = new Date().toISOString().split('T')[0], status } = req.query;

    const classRes = await query('SELECT *, COALESCE(study_time, \'08:00 AM - 11:30 AM\') AS study_time FROM classes WHERE UPPER(class_name) = UPPER($1)', [className.trim()]);
    if (classRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Class "${className}" not found.`
      });
    }

    const classInfo = classRes.rows[0];

    let sql = `
      SELECT 
        s.id AS student_db_id,
        s.student_id,
        s.full_name,
        s.class_name,
        s.profile_photo,
        a.id AS attendance_id,
        COALESCE(a.attendance_date, $2::date) AS attendance_date,
        a.attendance_time,
        a.face_photo,
        CASE 
          WHEN a.status IS NOT NULL THEN a.status 
          ELSE 'Absent' 
        END AS status,
        a.created_at
      FROM students s
      LEFT JOIN attendance a 
        ON s.student_id = a.student_id 
        AND a.attendance_date = $2::date
      WHERE UPPER(s.class_name) = UPPER($1)
    `;

    const params = [classInfo.class_name, date];

    if (status && status.trim() && status !== 'All') {
      if (status.trim() === 'Absent') {
        sql += ` AND a.id IS NULL`;
      } else {
        params.push(status.trim());
        sql += ` AND a.status = $${params.length}`;
      }
    }

    sql += ` ORDER BY CASE WHEN a.status IS NOT NULL THEN 0 ELSE 1 END, a.attendance_time ASC NULLS LAST, s.student_id ASC`;

    const studentsRes = await query(sql, params);
    const students = studentsRes.rows;

    // Overall summary for this classroom on this date
    const allStudentsInClassRes = await query(`
      SELECT 
        COUNT(DISTINCT s.id)::int as total,
        COUNT(DISTINCT a.id)::int as present,
        COUNT(DISTINCT CASE WHEN a.status = 'Late' THEN a.id END)::int as late
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.attendance_date = $2::date
      WHERE UPPER(s.class_name) = UPPER($1)
    `, [classInfo.class_name, date]);

    const summaryData = allStudentsInClassRes.rows[0] || { total: 0, present: 0, late: 0 };
    const totalEnrolled = summaryData.total || 0;
    const presentCount = summaryData.present || 0;
    const lateCount = summaryData.late || 0;
    const absentCount = Math.max(0, totalEnrolled - presentCount);
    const attendanceRate = totalEnrolled > 0 
      ? Number(((presentCount / totalEnrolled) * 100).toFixed(1)) 
      : 0;

    return res.status(200).json({
      success: true,
      class_info: classInfo,
      date,
      stats: {
        total_enrolled: totalEnrolled,
        present_today: presentCount,
        late_today: lateCount,
        absent_today: absentCount,
        attendance_rate: attendanceRate
      },
      count: students.length,
      students
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/classes
async function createClass(req, res, next) {
  try {
    const { class_name, description, study_time } = req.body;

    if (!class_name || !class_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Class Name is required.'
      });
    }

    const trimmed = class_name.trim();

    // Check duplicate
    const existing = await query('SELECT id FROM classes WHERE UPPER(class_name) = UPPER($1)', [trimmed]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Class "${trimmed}" already exists.`
      });
    }

    const result = await query(
      'INSERT INTO classes (class_name, description, study_time) VALUES ($1, $2, $3) RETURNING *',
      [trimmed, description ? description.trim() : '', study_time ? study_time.trim() : '08:00 AM - 11:30 AM']
    );

    return res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      class: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/classes/:id
async function updateClass(req, res, next) {
  try {
    const { id } = req.params;
    const { class_name, description, study_time } = req.body;

    if (!class_name || !class_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Class Name is required.'
      });
    }

    const trimmed = class_name.trim();

    const result = await query(
      `UPDATE classes 
       SET class_name = $1, description = $2, study_time = $3
       WHERE id = $4
       RETURNING *`,
      [trimmed, description ? description.trim() : '', study_time ? study_time.trim() : '08:00 AM - 11:30 AM', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully.',
      class: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/classes/:id
async function deleteClass(req, res, next) {
  try {
    const { id } = req.params;

    // Check if students belong to this class
    const checkStudents = await query(
      'SELECT id FROM students WHERE class_name = (SELECT class_name FROM classes WHERE id = $1)',
      [id]
    );

    if (checkStudents.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class because students are currently enrolled in it. Reassign students first.'
      });
    }

    const result = await query('DELETE FROM classes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully.',
      deleted_class: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllClasses,
  getClassAttendance,
  createClass,
  updateClass,
  deleteClass
};
