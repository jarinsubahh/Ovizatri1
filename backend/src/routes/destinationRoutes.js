const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

// Specific path before the dynamic /:id route
router.get('/top-rated', destinationController.getTopRatedDestinations);
router.get('/:id', destinationController.getDestinationById);
router.get('/', destinationController.getAllDestinations);

module.exports = router;