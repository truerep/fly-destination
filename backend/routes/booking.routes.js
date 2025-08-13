const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// All routes require auth
router.use(authenticateToken);

// Agent: search available tickets
router.get('/search',
  restrictTo('agent'),
  query('from').isLength({ min: 3, max: 3 }),
  query('to').isLength({ min: 3, max: 3 }),
  query('date').isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  bookingController.searchTickets
);

// Agent: create booking
router.post('/',
  restrictTo('agent'),
  body('ticketId').isMongoId(),
  body('quantity').isInt({ min: 1 }),
  body('infants').optional().isInt({ min: 0 }),
  body('passengers').optional().isArray(),
  handleValidationErrors,
  bookingController.createBooking
);

// Agent: list own bookings
router.get('/',
  restrictTo('agent'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('q').optional().isString(),
  query('reference').optional().isString(),
  query('pnr').optional().isString(),
  handleValidationErrors,
  bookingController.listMyBookings
);

// Agent: request name change for a booking
router.post('/:id/request-name-change',
  restrictTo('agent'),
  param('id').isMongoId(),
  body('note').optional().isString(),
  handleValidationErrors,
  bookingController.requestNameChange
);

// Admin: process name change
router.post('/:id/process-name-change',
  restrictTo('admin'),
  param('id').isMongoId(),
  body('action').isIn(['approve', 'reject']),
  body('passengers').optional().isArray(),
  body('note').optional().isString(),
  handleValidationErrors,
  bookingController.processNameChange
);

// Admin: list/search all bookings
router.get('/admin/all',
  restrictTo('admin'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('q').optional().isString(),
  query('reference').optional().isString(),
  query('pnr').optional().isString(),
  query('partner').optional().isString(),
  handleValidationErrors,
  bookingController.listAllBookings
);

module.exports = router;


