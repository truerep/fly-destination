const express = require('express');
const router = express.Router();

const promoController = require('../controllers/promoController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

router.use(authenticateToken);

// Admin: create/update promo for agent
router.post('/',
  restrictTo('admin'),
  body('agent').optional().isMongoId(),
  body('agentId').optional().isString(),
  body('code').isString().isLength({ min: 2 }),
  body('amount').isFloat({ min: 0 }),
  body('isPercent').optional().isBoolean(),
  body('maxDiscount').optional().isFloat({ min: 0 }),
  body('startsAt').optional().isISO8601(),
  body('endsAt').optional().isISO8601(),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
  handleValidationErrors,
  promoController.createOrUpdate
);

// Admin: toggle active/inactive
router.post('/:id/toggle',
  restrictTo('admin'),
  param('id').isMongoId(),
  body('isActive').isBoolean(),
  handleValidationErrors,
  promoController.toggleActive
);

// Agent: list own promos
router.get('/mine', restrictTo('agent'), promoController.listForAgent);

// Admin: list all promos and delete
router.get('/', restrictTo('admin'), promoController.listAllAdmin);
router.delete('/:id', restrictTo('admin'), param('id').isMongoId(), handleValidationErrors, promoController.deletePromo);

module.exports = router;


