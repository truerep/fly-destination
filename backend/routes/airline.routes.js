const express = require('express');
const router = express.Router();

const airlineController = require('../controllers/airlineController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

router.use(authenticateToken);

// Public to authenticated roles (agent/admin) for listing
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('q').optional().isString(),
  query('isActive').optional().isIn(['true','false']),
  handleValidationErrors,
  airlineController.list
);

// Admin-only for create/update/delete
router.post('/',
  restrictTo('admin'),
  body('name').isString().isLength({ min: 2 }),
  body('logoBase64').optional().isString(),
  body('logoUrl').optional().isString(),
  handleValidationErrors,
  airlineController.create
);

router.put('/:id',
  restrictTo('admin'),
  param('id').isMongoId(),
  body('name').optional().isString(),
  body('logoBase64').optional().isString(),
  body('logoUrl').optional().isString(),
  body('isActive').optional().isBoolean(),
  handleValidationErrors,
  airlineController.update
);

router.delete('/:id',
  restrictTo('admin'),
  param('id').isMongoId(),
  handleValidationErrors,
  airlineController.remove
);

module.exports = router;


