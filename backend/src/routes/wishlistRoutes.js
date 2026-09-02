const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All wishlist routes require authentication — authenticateToken
// returns 401 Unauthorized automatically when no valid token is present.
router.use(authenticateToken);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);

module.exports = router;