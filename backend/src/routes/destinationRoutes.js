const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/top-rated', destinationController.getTopRatedDestinations);
router.get('/:id', destinationController.getDestinationById);
router.get('/', destinationController.getAllDestinations);

// Protected Admin creation route
router.post('/', authenticateToken, authorizeRoles('admin'), destinationController.createDestination);

module.exports = router;