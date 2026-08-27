const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.patch('/agencies/:agencyUserId/verify', adminController.verifyAgency);

module.exports = router;
