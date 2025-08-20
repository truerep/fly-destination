const express = require('express');
const router = express.Router();

const airportController = require('../controllers/airportController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const {
  validateAirportCreation,
  validateAirportUpdate,
  validateAirportId,
  validateAirportCode,
  validateAirportSearch,
  validateBulkAirportImport,
  validatePagination
} = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Agent-accessible lightweight list for suggestions
router.get('/agent-list',
  restrictTo('agent'),
  validateAirportSearch,
  airportController.searchAirports
);

// Note: removed agent GET '/' to avoid conflicting with admin listing

// Read endpoints accessible to both admin and agent
router.get('/', restrictTo('admin', 'agent'), validatePagination, airportController.getAllAirports);
router.get('/search', restrictTo('admin', 'agent'), validateAirportSearch, airportController.searchAirports);
router.get('/code/:code', restrictTo('admin', 'agent'), validateAirportCode, airportController.getAirportByCode);
router.get('/:id', restrictTo('admin', 'agent'), validateAirportId, airportController.getAirportById);

// Admin-only routes
router.post('/', restrictTo('admin'), validateAirportCreation, airportController.createAirport);
router.post('/bulk-import', restrictTo('admin'), validateBulkAirportImport, airportController.bulkImportAirports);
router.put('/:id', restrictTo('admin'), validateAirportId, validateAirportUpdate, airportController.updateAirport);
router.delete('/:id', restrictTo('admin'), validateAirportId, airportController.deleteAirport);

// Airport status management (admin only)
router.patch('/:id/activate', restrictTo('admin'), validateAirportId, airportController.activateAirport);
router.patch('/:id/deactivate', restrictTo('admin'), validateAirportId, airportController.deactivateAirport);

module.exports = router; 