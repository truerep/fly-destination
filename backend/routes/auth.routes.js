const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateOTPVerification,
  validateSendOTP,
  validateUserUpdate,
  validatePasswordChange
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/send-otp', validateSendOTP, authController.sendOTP);
router.post('/verify-otp', validateOTPVerification, authController.verifyOTP);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(authenticateToken); // Apply authentication middleware to all routes below

router.get('/profile', authController.getProfile);
router.put('/profile', validateUserUpdate, authController.updateProfile);
router.put('/change-password', validatePasswordChange, authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router; 