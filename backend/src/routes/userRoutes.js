const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.put('/profile', authenticateToken, userController.updateProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);

module.exports = router;
