const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/top-rated', destinationController.getTopRatedDestinations);
router.get('/pending', authenticateToken, authorizeRoles('admin'), destinationController.getPendingDestinations);
router.get('/', destinationController.getAllDestinations);
router.get('/:id', destinationController.getDestinationById);

router.post('/', authenticateToken, authorizeRoles('user', 'agency', 'admin'), destinationController.createDestination);
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), destinationController.updateDestinationStatus);

module.exports = router;