const { query } = require('../config/db');
const { uploadAttendanceImage, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Helper to format 24-hr time
function getCurrentFormattedTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Helper to determine status: after 08:30 is Late
function determineAttendanceStatus(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const cutoffMinutes = 8 * 60 + 30; // 08:30 AM
  return totalMinutes > cutoffMinutes ? 'Late' : 'Present';
}

// POST /api/attendance
async function submitAttendance(req, res, next) {
  let uploadedFilePath = null;
  if (req.file) {
    uploadedFilePath = req.file.path;
  }

  try {
    const { student_id } = req.body;

    // 1. Validate student_id input
    if (!student_id || !student_id.trim()) {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({
        success: false,
        message: 'Student ID is required.'
      });
    }

    // 2. Validate face photo upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Face photo is required. Please capture your photo before submitting.'
      });
    }

    const trimmedId = student_id.trim().toUpperCase();

    // 3. Check student exists in DB
    const studentRes = await query(
      'SELECT id, student_id, full_name, class_name, profile_photo FROM students WHERE UPPER(student_id) = UPPER($1)',
      [trimmedId]
    );

    if (studentRes.rows.length === 0) {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      return res.status(404).json({
        success: false,
        message: 'Student ID Not Found. Please Check Your Student ID Card.'
      });
    }

    const student = studentRes.rows[0];

    // 4. Check duplicate attendance for today
    const checkDuplicate = await query(
      'SELECT id, attendance_date, attendance_time FROM attendance WHERE student_id = $1 AND attendance_date = CURRENT_DATE',
      [student.student_id]
    );

    if (checkDuplicate.rows.length > 0) {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({
        success: false,
        message: 'Attendance Already Submitted Today.',
        attendance: checkDuplicate.rows[0]
      });
    }

    // 5. Server-derived date, time, and status
    const serverTime = getCurrentFormattedTime();
    const status = determineAttendanceStatus(serverTime);
    let photoUrl = `/uploads/attendance/${req.file.filename}`;

    // Upload to Cloudinary in folder 'attendance_image'
    if (isCloudinaryConfigured) {
      try {
        const cloudSecureUrl = await uploadAttendanceImage(req.file.path, student.student_id);
        if (cloudSecureUrl) {
          photoUrl = cloudSecureUrl;
          console.log(`Face ID image uploaded to Cloudinary: ${cloudSecureUrl}`);

          // Clean up local temp file after upload
          if (fs.existsSync(req.file.path)) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (e) {
              // ignore cleanup
            }
          }
        }
      } catch (cloudErr) {
        console.error('Cloudinary upload warning (using local fallback):', cloudErr.message);
      }
    }

    // 6. Insert attendance record
    const insertRes = await query(
      `INSERT INTO attendance (student_id, attendance_date, attendance_time, face_photo, status)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)
       RETURNING id, student_id, attendance_date, attendance_time, face_photo, status, created_at`,
      [student.student_id, serverTime, photoUrl, status]
    );

    const newRecord = insertRes.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Attendance Submitted Successfully.',
      attendance: {
        ...newRecord,
        full_name: student.full_name,
        class_name: student.class_name,
        profile_photo: student.profile_photo
      }
    });
  } catch (error) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (e) {
        // ignore cleanup error
      }
    }

    // Handle database unique constraint violation (code 23505)
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Attendance Already Submitted Today.'
      });
    }

    next(error);
  }
}

// GET /api/attendance/today
async function getTodayAttendance(req, res, next) {
  try {
    const { class_name, status } = req.query;

    let sql = `
      SELECT 
        a.id, 
        s.student_id, 
        CURRENT_DATE AS attendance_date, 
        a.attendance_time, 
        a.face_photo,
        CASE 
          WHEN a.status IS NOT NULL THEN a.status 
          ELSE 'Absent' 
        END AS status, 
        a.created_at,
        s.full_name, 
        s.class_name, 
        s.profile_photo
      FROM students s
      LEFT JOIN attendance a 
        ON s.student_id = a.student_id 
        AND a.attendance_date = CURRENT_DATE
      WHERE 1=1
    `;
    const params = [];

    if (class_name && class_name.trim() && class_name !== 'All') {
      params.push(class_name.trim());
      sql += ` AND s.class_name = $${params.length}`;
    }

    if (status && status.trim() && status !== 'All') {
      if (status.trim() === 'Absent') {
        sql += ` AND a.id IS NULL`;
      } else {
        params.push(status.trim());
        sql += ` AND a.status = $${params.length}`;
      }
    }

    sql += ` ORDER BY CASE WHEN a.status IS NOT NULL THEN 0 ELSE 1 END, a.attendance_time ASC NULLS LAST, s.student_id ASC`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      attendance: result.rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/attendance/student/:studentId
async function getStudentAttendanceHistory(req, res, next) {
  try {
    const { studentId } = req.params;

    const trimmedId = studentId.trim();

    // Verify student exists
    const studentRes = await query(
      'SELECT id, student_id, full_name, class_name, profile_photo FROM students WHERE UPPER(student_id) = UPPER($1)',
      [trimmedId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student ID Not Found. Please Check Your Student ID Card.'
      });
    }

    const student = studentRes.rows[0];

    const result = await query(
      `SELECT id, student_id, attendance_date, attendance_time, face_photo, status, created_at
       FROM attendance
       WHERE student_id = $1
       ORDER BY attendance_date DESC, attendance_time DESC`,
      [student.student_id]
    );

    return res.status(200).json({
      success: true,
      student,
      total_records: result.rows.length,
      history: result.rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/attendance (All records with filters)
// When a date is provided (e.g. today), includes Absent students as well as Present/Late.
async function getAllAttendance(req, res, next) {
  try {
    const { date, class_name, status, search } = req.query;

    if (date && date.trim()) {
      let sql = `
        SELECT 
          a.id, 
          s.student_id, 
          $1::date AS attendance_date, 
          a.attendance_time, 
          a.face_photo,
          CASE 
            WHEN a.status IS NOT NULL THEN a.status 
            ELSE 'Absent' 
          END AS status, 
          a.created_at,
          s.full_name, 
          s.class_name, 
          s.profile_photo
        FROM students s
        LEFT JOIN attendance a 
          ON s.student_id = a.student_id 
          AND a.attendance_date = $1::date
        WHERE 1=1
      `;
      const params = [date.trim()];

      if (class_name && class_name.trim() && class_name !== 'All') {
        params.push(class_name.trim());
        sql += ` AND s.class_name = $${params.length}`;
      }

      if (status && status.trim() && status !== 'All') {
        if (status.trim() === 'Absent') {
          sql += ` AND a.id IS NULL`;
        } else {
          params.push(status.trim());
          sql += ` AND a.status = $${params.length}`;
        }
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        sql += ` AND (s.student_id ILIKE $${params.length} OR s.full_name ILIKE $${params.length})`;
      }

      sql += ' ORDER BY CASE WHEN a.status IS NOT NULL THEN 0 ELSE 1 END, a.attendance_time ASC NULLS LAST, s.student_id ASC';

      const result = await query(sql, params);

      // Summary counts for this date / filter
      const presentCount = result.rows.filter(r => r.status === 'Present').length;
      const lateCount = result.rows.filter(r => r.status === 'Late').length;
      const absentCount = result.rows.filter(r => r.status === 'Absent').length;

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        summary: {
          total: result.rows.length,
          present: presentCount,
          late: lateCount,
          absent: absentCount
        },
        attendance: result.rows
      });
    } else {
      // Historical query across all dates without a single fixed date
      let sql = `
        SELECT a.id, a.student_id, a.attendance_date, a.attendance_time, a.face_photo, a.status, a.created_at,
               s.full_name, s.class_name, s.profile_photo
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE 1=1
      `;
      const params = [];

      if (class_name && class_name.trim() && class_name !== 'All') {
        params.push(class_name.trim());
        sql += ` AND s.class_name = $${params.length}`;
      }

      if (status && status.trim() && status !== 'All') {
        params.push(status.trim());
        sql += ` AND a.status = $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        sql += ` AND (a.student_id ILIKE $${params.length} OR s.full_name ILIKE $${params.length})`;
      }

      sql += ' ORDER BY a.attendance_date DESC, a.attendance_time DESC';

      const result = await query(sql, params);

      return res.status(200).json({
        success: true,
        count: result.rows.length,
        attendance: result.rows
      });
    }
  } catch (error) {
    next(error);
  }
}

// GET /api/attendance/export/csv
async function exportAttendanceCSV(req, res, next) {
  try {
    const { date, class_name, status } = req.query;

    let sql;
    let params = [];

    if (date && date.trim()) {
      sql = `
        SELECT 
          COALESCE(a.id, 0) AS id,
          s.student_id,
          s.full_name,
          s.class_name,
          $1::date AS attendance_date,
          COALESCE(a.attendance_time, 'Not Checked In') AS attendance_time,
          CASE 
            WHEN a.status IS NOT NULL THEN a.status 
            ELSE 'Absent' 
          END AS status,
          COALESCE(a.face_photo, 'N/A') AS face_photo
        FROM students s
        LEFT JOIN attendance a 
          ON s.student_id = a.student_id 
          AND a.attendance_date = $1::date
        WHERE 1=1
      `;
      params.push(date.trim());

      if (class_name && class_name.trim() && class_name !== 'All') {
        params.push(class_name.trim());
        sql += ` AND s.class_name = $${params.length}`;
      }

      if (status && status.trim() && status !== 'All') {
        if (status.trim() === 'Absent') {
          sql += ` AND a.id IS NULL`;
        } else {
          params.push(status.trim());
          sql += ` AND a.status = $${params.length}`;
        }
      }

      sql += ' ORDER BY CASE WHEN a.status IS NOT NULL THEN 0 ELSE 1 END, a.attendance_time ASC NULLS LAST, s.student_id ASC';
    } else {
      sql = `
        SELECT a.id, a.student_id, s.full_name, s.class_name, a.attendance_date, a.attendance_time, a.status, a.face_photo
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE 1=1
      `;
      if (class_name && class_name.trim() && class_name !== 'All') {
        params.push(class_name.trim());
        sql += ` AND s.class_name = $${params.length}`;
      }
      if (status && status.trim() && status !== 'All') {
        params.push(status.trim());
        sql += ` AND a.status = $${params.length}`;
      }
      sql += ' ORDER BY a.attendance_date DESC, a.attendance_time ASC';
    }

    const result = await query(sql, params);

    // Build CSV
    const headers = ['Record ID', 'Student ID', 'Full Name', 'Class Name', 'Attendance Date', 'Attendance Time', 'Status', 'Face Photo URL'];
    const rows = result.rows.map((row) => [
      row.id || 'N/A',
      `"${row.student_id}"`,
      `"${row.full_name.replace(/"/g, '""')}"`,
      `"${row.class_name.replace(/"/g, '""')}"`,
      new Date(row.attendance_date).toISOString().split('T')[0],
      `"${row.attendance_time}"`,
      row.status,
      `"${row.face_photo}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_export_${date || 'all'}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/attendance/reset
async function resetAttendance(req, res, next) {
  try {
    await query('DELETE FROM attendance');
    return res.status(200).json({
      success: true,
      message: 'All attendance records reset for testing.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitAttendance,
  getTodayAttendance,
  getStudentAttendanceHistory,
  getAllAttendance,
  exportAttendanceCSV,
  resetAttendance
};
