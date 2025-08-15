const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserUpdate,
  validateUserId,
  validatePagination
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Admin-only routes
router.use(restrictTo('admin')); // Apply admin restriction to all routes below

// User CRUD operations
router.get('/', validatePagination, userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/search', validatePagination, userController.searchUsers);
router.get('/:id', validateUserId, userController.getUserById);
router.post('/', validateUserRegistration, userController.createUser);
router.put('/:id', validateUserId, validateUserUpdate, userController.updateUser);
router.delete('/:id', validateUserId, userController.deleteUser);

// User status management
router.patch('/:id/block', validateUserId, userController.blockUser);
router.patch('/:id/unblock', validateUserId, userController.unblockUser);
router.patch('/:id/activate', validateUserId, userController.activateUser);
router.patch('/:id/deactivate', validateUserId, userController.deactivateUser);
router.patch('/:id/approve', validateUserId, userController.approveUser);

module.exports = router; 