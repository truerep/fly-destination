const { body, param, query, validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    return ResponseHandler.validationError(res, formattedErrors);
  }
  next();
};

/**
 * User registration validation rules
 */
const validateUserRegistration = [
  body('userType')
    .isIn(['agent', 'customer', 'admin'])
    .withMessage('User type must be agent, customer, or admin'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  // Conditional validation for agents
  body('companyName')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('Company name is required for agents'),
  
  body('gst')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('GST is required for agents'),
  
  body('pan')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('PAN is required for agents'),
  
  body('panName')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('PAN name is required for agents'),
  
  body('contactPersonName')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('Contact person name is required for agents'),
  
  body('contactPersonDesignation')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('Contact person designation is required for agents'),
  
  body('contactPersonEmail')
    .if(body('userType').equals('agent'))
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact person email'),
  
  body('contactPersonMobile')
    .if(body('userType').equals('agent'))
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid contact person mobile number'),
  
  body('address')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('Address is required for agents'),
  
  body('city')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('City is required for agents'),
  
  body('state')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('State is required for agents'),
  
  body('country')
    .if(body('userType').equals('agent'))
    .notEmpty()
    .withMessage('Country is required for agents'),
  
  body('pincode')
    .if(body('userType').equals('agent'))
    .matches(/^\d{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  handleValidationErrors
];

/**
 * User login validation rules (supports email, phone, or agent ID)
 */
const validateUserLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Please provide an identifier (email, phone number, or agent ID)')
    .custom((value) => {
      // Check if it's a valid email
      if (value.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error('Please provide a valid email address');
        }
        return true;
      }
      
      // Check if it's a valid agent ID (FD + 4 digits)
      if (/^FD\d{4}$/.test(value)) {
        return true;
      }
      
      // Check if it's a valid phone number
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(value)) {
        throw new Error('Please provide a valid email address, phone number, or agent ID');
      }
      
      return true;
    })
    .withMessage('Please provide a valid email address, phone number, or agent ID'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * OTP verification validation rules
 */
const validateOTPVerification = [
  body('phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('otp')
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be 4-6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  
  handleValidationErrors
];

/**
 * Send OTP validation rules
 */
const validateSendOTP = [
  body('phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

/**
 * User update validation rules
 */
const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phoneNumber')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('companyName')
    .optional()
    .notEmpty()
    .withMessage('Company name cannot be empty'),
  
  body('gst')
    .optional()
    .notEmpty()
    .withMessage('GST cannot be empty'),
  
  body('pan')
    .optional()
    .notEmpty()
    .withMessage('PAN cannot be empty'),
  
  body('contactPersonEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact person email'),
  
  body('contactPersonMobile')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid contact person mobile number'),
  
  body('pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  handleValidationErrors
];

/**
 * Password change validation rules
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

/**
 * User ID parameter validation
 */
const validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  handleValidationErrors
];

/**
 * Pagination query validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('userType')
    .optional()
    .isIn(['agent', 'customer', 'admin'])
    .withMessage('User type must be agent, customer, or admin'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateOTPVerification,
  validateSendOTP,
  validateUserUpdate,
  validatePasswordChange,
  validateUserId,
  validatePagination
}; 