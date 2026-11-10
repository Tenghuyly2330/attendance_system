const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/authMiddleware');

// Admin login
router.post('/login', adminController.adminLogin);

// Admin dashboard statistics (protected by token or public for demo)
router.get('/stats', adminController.getAdminStats);

// Verify admin token
router.get('/verify', verifyAdminToken, adminController.verifyAdminAuth);

module.exports = router;

