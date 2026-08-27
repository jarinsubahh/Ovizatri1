const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes
router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageById);

// Agency protected routes
router.post('/', authenticateToken, authorizeRoles('agency', 'admin'), packageController.createPackage);
router.get('/agency/my-packages', authenticateToken, authorizeRoles('agency'), packageController.getAgencyPackages);

module.exports = router;
