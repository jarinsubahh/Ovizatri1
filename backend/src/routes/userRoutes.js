const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.put('/profile', authenticateToken, userController.updateProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);
router.delete('/profile', authenticateToken, userController.deleteAccount);
router.delete('/delete-account', authenticateToken, userController.deleteAccount);

module.exports = router;
