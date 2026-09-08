const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all wishlist routes: requires auth and strictly 'user' (traveler) role
router.use(authenticateToken);
router.use(authorizeRoles('user'));

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);

module.exports = router;