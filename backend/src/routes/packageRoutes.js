const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageById);
router.post('/', authenticateToken, authorizeRole('ADMIN'), packageController.createPackage);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), packageController.updatePackage);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), packageController.deletePackage);

module.exports = router;
