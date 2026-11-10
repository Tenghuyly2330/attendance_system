const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// POST /api/admin/login
async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const adminRes = await query('SELECT * FROM admin_users WHERE username = $1', [username.trim()]);
    if (adminRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password.'
      });
    }

    const admin = adminRes.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password.'
      });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/stats
async function getAdminStats(req, res, next) {
  try {
    const { date } = req.query;
    const isSpecificDate = date && date.trim();
    const dateParam = isSpecificDate ? [date.trim()] : [];
    const dateClause = isSpecificDate ? 'attendance_date = $1::date' : 'attendance_date = CURRENT_DATE';

    // 1. Total students
    const totalStudentsRes = await query('SELECT COUNT(*)::int as total FROM students');
    const totalStudents = totalStudentsRes.rows[0]?.total || 0;

    // 2. Total classes
    const totalClassesRes = await query('SELECT COUNT(*)::int as total FROM classes');
    const totalClasses = totalClassesRes.rows[0]?.total || 0;

    // 3. Attendance count for target date
    const todayAttRes = await query(
      `SELECT COUNT(*)::int as total FROM attendance WHERE ${dateClause}`,
      dateParam
    );
    const totalAttendanceToday = todayAttRes.rows[0]?.total || 0;

    // 4. Late attendance count
    const lateAttRes = await query(
      `SELECT COUNT(*)::int as total FROM attendance WHERE ${dateClause} AND status = 'Late'`,
      dateParam
    );
    const totalLateToday = lateAttRes.rows[0]?.total || 0;

    // 5. On-time count
    const onTimeToday = totalAttendanceToday - totalLateToday;

    // 6. Absent students
    const totalAbsentToday = Math.max(0, totalStudents - totalAttendanceToday);

    // 7. Attendance Percentage
    const attendancePercentage = totalStudents > 0 
      ? Number(((totalAttendanceToday / totalStudents) * 100).toFixed(1))
      : 0;

    // 8. Breakdown by class for target date
    const classBreakdownSql = `
      SELECT 
        c.class_name,
        COALESCE(c.study_time, '08:00 AM - 11:30 AM') AS study_time,
        COUNT(DISTINCT s.id)::int as total_enrolled,
        COUNT(DISTINCT a.id)::int as present_today,
        COUNT(DISTINCT CASE WHEN a.status = 'Late' THEN a.id END)::int as late_today
      FROM classes c
      LEFT JOIN students s ON c.class_name = s.class_name
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.${dateClause}
      GROUP BY c.class_name, c.study_time
      ORDER BY c.class_name ASC
    `;
    const classBreakdownRes = await query(classBreakdownSql, dateParam);

    const classStats = classBreakdownRes.rows.map(row => {
      const absent = Math.max(0, row.total_enrolled - row.present_today);
      const rate = row.total_enrolled > 0 ? Number(((row.present_today / row.total_enrolled) * 100).toFixed(1)) : 0;
      return {
        ...row,
        absent_today: absent,
        attendance_rate: rate
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        total_students: totalStudents,
        total_classes: totalClasses,
        total_attendance_today: totalAttendanceToday,
        total_absent_today: totalAbsentToday,
        total_late_today: totalLateToday,
        on_time_today: onTimeToday,
        attendance_percentage: attendancePercentage
      },
      class_stats: classStats
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/verify
async function verifyAdminAuth(req, res) {
  return res.status(200).json({
    success: true,
    admin: req.admin
  });
}

module.exports = {
  adminLogin,
  getAdminStats,
  verifyAdminAuth
};

