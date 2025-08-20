const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Auth required, agent only
router.use(authenticateToken);
router.use(restrictTo('agent'));

router.post('/marker-amount',
  body('markerAmount').isFloat({ min: 0 }),
  handleValidationErrors,
  userController.updateMyMarkerAmount
);

module.exports = router;


