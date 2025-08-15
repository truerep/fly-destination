const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return ResponseHandler.unauthorized(res, 'User no longer exists');
    }

    // Check if user is active
    if (!user.isActive) {
      return ResponseHandler.forbidden(res, 'Account is deactivated');
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return ResponseHandler.forbidden(res, 'Account is blocked');
    }

    // For agents accessing protected routes, ensure approved
    if (user.userType === 'agent' && !user.isApproved) {
      return ResponseHandler.forbidden(res, 'Account pending for approval');
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return ResponseHandler.unauthorized(res, 'Password recently changed, please login again');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler.unauthorized(res, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler.unauthorized(res, 'Token expired');
    }
    return ResponseHandler.error(res, 'Authentication failed');
  }
};

/**
 * Restrict access to specific user types
 */
const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return ResponseHandler.forbidden(res, 'You do not have permission to perform this action');
    }
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive && !user.isBlocked) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  authenticateToken,
  restrictTo,
  optionalAuth,
  generateToken
}; 