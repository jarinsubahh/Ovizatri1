const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Soft auth helper for reading reviews (allows both guests and logged-in users)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  next();
};

// 1. Get all reviews for a package (public & authenticated)
router.get('/package/:packageId', optionalAuth, reviewController.getPackageReviews);

// 2. Traveler only: Post a review
router.post('/', authenticateToken, authorizeRoles('user'), reviewController.createReview);

// 3. Traveler only: Like / Dislike review
router.post('/:reviewId/react', authenticateToken, authorizeRoles('user'), reviewController.reactToReview);

// 4. Traveler (owner) OR Admin
router.delete('/:id', authenticateToken, authorizeRoles('user', 'admin'), reviewController.deleteReview);

module.exports = router;