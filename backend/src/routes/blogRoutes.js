const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticateToken } = require('../middleware/authMiddleware');


router.get('/', blogController.getPublishedBlogs);
router.get('/user/my-blogs', authenticateToken, blogController.getMyBlogs);
router.get('/:id', blogController.getBlogById);


router.post('/', authenticateToken, blogController.createBlog);

module.exports = router;