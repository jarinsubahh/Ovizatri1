const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public: View all reviews for a package
router.get('/package/:packageId', reviewController.getPackageReviews);

// Traveler only: Post a review
router.post('/', authenticateToken, authorizeRoles('user'), reviewController.createReview);

// Traveler (owns review) OR Admin (can delete any review)
router.delete('/:id', authenticateToken, authorizeRoles('user', 'admin'), reviewController.deleteReview);

module.exports = router;