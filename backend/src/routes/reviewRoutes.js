const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/package/:packageId', reviewController.getPackageReviews);
router.post('/', authenticateToken, authorizeRoles('user'), reviewController.createReview);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), reviewController.deleteReviewByAdmin);

module.exports = router;