const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, authorizeRole, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes — specific paths must be declared before the dynamic /:id route
router.get('/featured', packageController.getFeaturedPackages);
router.get('/agency/my-packages', authenticateToken, authorizeRoles('agency'), packageController.getAgencyPackages);
router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageById);

// Agency / Admin protected routes
router.post('/', authenticateToken, authorizeRoles('agency', 'admin'), packageController.createPackage);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), packageController.updatePackage);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), packageController.deletePackage);

module.exports = router;