const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

// Validation rules
const travelerSignupValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty if provided.'),
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty.'),
  validate,
];

const agencySignupValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  validate,
];

const loginValidation = [
  body('password').notEmpty().withMessage('Password is required.'),
  validate,
];

// Authentication Endpoints
// Signup
router.post('/signup/traveler', travelerSignupValidation, authController.signupTraveler);
router.post('/signup/agency', agencySignupValidation, authController.signupAgency);
router.post('/register', travelerSignupValidation, authController.signupTraveler); // Fallback generic register

// Login
router.post('/login', loginValidation, authController.login);
router.post('/signin', loginValidation, authController.login); // Frontend alias compatibility

// User session / info
router.get('/me', authenticateToken, authController.getCurrentUser);
router.get('/user', authenticateToken, authController.getCurrentUser); // Frontend alias compatibility
router.post('/logout', authController.logout);

module.exports = router;
