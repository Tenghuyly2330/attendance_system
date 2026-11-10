const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const { initDB } = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const classRoutes = require('./routes/classRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients (React dev server on port 3000, 3001, 5173, etc.)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded profile and attendance photos as static assets
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/admin', adminRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Student Attendance Management System API',
    status: 'online',
    documentation: {
      health: 'GET /api/health',
      search_student: 'GET /api/students/:studentId',
      submit_attendance: 'POST /api/attendance',
      today_attendance: 'GET /api/attendance/today',
      student_history: 'GET /api/attendance/student/:studentId',
      all_students: 'GET /api/students',
      classes: 'GET /api/classes',
      admin_stats: 'GET /api/admin/stats'
    }
  });
});

// 404 & Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Student Attendance Management Backend Server`);
    console.log(` Running on port: http://localhost:${PORT}`);
    console.log(` Health check:    http://localhost:${PORT}/api/health`);
    console.log(` Static uploads:  ${uploadsPath}`);
    console.log(`===============================================`);
  });
}

startServer();

module.exports = app;

