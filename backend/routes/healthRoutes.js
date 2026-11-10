const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET /api/health
router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbTime = null;

  try {
    const result = await query('SELECT NOW() as current_time');
    dbStatus = 'connected';
    dbTime = result.rows[0].current_time;
  } catch (error) {
    dbStatus = `error: ${error.message}`;
  }

  return res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'student-attendance-backend',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      time: dbTime
    }
  });
});

module.exports = router;

