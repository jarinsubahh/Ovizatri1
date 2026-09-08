const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAllUsers);
router.get('/agencies', adminController.getAllAgencies); // Add this
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.patch('/agencies/:agencyUserId/verify', adminController.verifyAgency);
router.get('/blogs', adminController.getAllBlogsForAdmin);
router.patch('/blogs/:id/status', adminController.updateBlogStatus);

module.exports = router;