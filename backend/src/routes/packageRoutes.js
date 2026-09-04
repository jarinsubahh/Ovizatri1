const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, authorizeRole, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/featured', packageController.getFeaturedPackages);
router.get('/pending', authenticateToken, authorizeRoles('admin'), packageController.getPendingPackages);
router.get('/agency/my-packages', authenticateToken, authorizeRoles('agency'), packageController.getAgencyPackages);
router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageById);

router.post('/', authenticateToken, authorizeRoles('agency', 'admin'), packageController.createPackage);
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), packageController.updatePackageStatus);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), packageController.updatePackage);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), packageController.deletePackage);

module.exports = router;