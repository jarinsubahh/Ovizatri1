const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const travelerSignupValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  validate,
];

const agencySignupValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  validate,
];

const genericRegisterValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  validate,
];

const loginValidation = [
  body('password').notEmpty().withMessage('Password is required.'),
  validate,
];

router.post('/register', genericRegisterValidation, authController.register);
router.post('/register/traveler', travelerSignupValidation, authController.signupTraveler);
router.post('/register/agency', agencySignupValidation, authController.signupAgency);

router.post('/signup/traveler', travelerSignupValidation, authController.signupTraveler);
router.post('/signup/agency', agencySignupValidation, authController.signupAgency);

router.post('/login', loginValidation, authController.login);
router.post('/signin', loginValidation, authController.login);

router.get('/me', authenticateToken, authController.getCurrentUser);
router.get('/user', authenticateToken, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;