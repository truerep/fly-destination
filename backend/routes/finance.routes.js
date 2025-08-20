const express = require('express');
const router = express.Router();

const financeController = require('../controllers/financeController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

router.use(authenticateToken);

// Agent endpoints
router.get('/me', restrictTo('agent'), financeController.getMyFinance);
router.get('/transactions', restrictTo('agent'), financeController.listMyTransactions);

router.post('/requests',
  restrictTo('agent'),
  body('type').isIn(['totalCreditLimit', 'availableCreditLimit', 'balanceDueSettlement']),
  body('amount').isFloat({ min: 1 }),
  body('note').optional().isString(),
  body('paymentScreenshotBase64').optional().isString(),
  body('paymentReference').optional().isString(),
  handleValidationErrors,
  financeController.requestFinance
);

router.get('/requests',
  restrictTo('agent'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  financeController.listMyRequests
);

// Admin endpoints
router.get('/admin/requests',
  restrictTo('admin'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('type').optional().isIn(['totalCreditLimit', 'availableCreditLimit', 'balanceDueSettlement']),
  query('q').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  financeController.adminListRequests
);

router.get('/admin/transactions',
  restrictTo('admin'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('q').optional().isString(),
  query('agentId').optional().isString(),
  handleValidationErrors,
  financeController.listTransactionsAdmin
);

router.post('/admin/requests/:id/process',
  restrictTo('admin'),
  param('id').isMongoId(),
  body('action').isIn(['approve', 'reject']),
  body('note').optional().isString(),
  handleValidationErrors,
  financeController.adminProcessRequest
);

router.post('/admin/agents/:agentId/adjust',
  restrictTo('admin'),
  param('agentId').isString(),
  body('totalCreditLimitDelta').optional().isFloat(),
  body('availableCreditLimitDelta').optional().isFloat(),
  body('balanceDueDelta').optional().isFloat(),
  body('note').optional().isString(),
  handleValidationErrors,
  financeController.adminAdjustFinance
);

router.get('/admin/receivables', restrictTo('admin'), financeController.adminReceivables);

module.exports = router;


