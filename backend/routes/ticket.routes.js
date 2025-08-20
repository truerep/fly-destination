const express = require('express');
const router = express.Router();

const ticketController = require('../controllers/ticketController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// All routes require auth
router.use(authenticateToken);

// Admin-only routes for inventory management
router.post('/',
  restrictTo('admin'),
  body('fromAirport').isLength({ min: 3, max: 3 }).withMessage('fromAirport must be 3 letters'),
  body('toAirport').isLength({ min: 3, max: 3 }).withMessage('toAirport must be 3 letters'),
  body('airline').notEmpty(),
  body('flightNumber').notEmpty(),
  body('departureTime').isISO8601().toDate(),
  body('arrivalTime').isISO8601().toDate(),
  body('basePrice').isFloat({ min: 0 }),
  body('quantityTotal').isInt({ min: 0 }),
  body('quantityAvailable').optional().isInt({ min: 0 }),
  handleValidationErrors,
  ticketController.createTicket
);

router.put('/:id',
  restrictTo('admin'),
  param('id').isMongoId(),
  handleValidationErrors,
  ticketController.updateTicket
);

router.delete('/:id',
  restrictTo('admin'),
  param('id').isMongoId(),
  handleValidationErrors,
  ticketController.deleteTicket
);

router.get('/:id',
  restrictTo('admin', 'agent'),
  param('id').isMongoId(),
  handleValidationErrors,
  ticketController.getTicketById
);

router.get('/',
  restrictTo('admin'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('from').optional().isLength({ min: 3, max: 3 }),
  query('to').optional().isLength({ min: 3, max: 3 }),
  query('date').optional().isISO8601(),
  query('airline').optional().isString(),
  query('pnr').optional().isString(),
  query('q').optional().isString(),
  query('isActive').optional().isIn(['true', 'false']),
  handleValidationErrors,
  ticketController.listTickets
);

module.exports = router;


