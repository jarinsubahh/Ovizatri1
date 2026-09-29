const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/mine', authenticateToken, authorizeRoles('user'), bookingController.getMyBookings);
router.post('/pay', authenticateToken, authorizeRoles('user'), bookingController.postDemoPayment);

module.exports = router;
