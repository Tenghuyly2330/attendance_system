const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'attendance_management_secret_key_2026';

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Admin authentication token is required.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

module.exports = {
  verifyAdminToken,
  JWT_SECRET
};

