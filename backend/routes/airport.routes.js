const express = require('express');
const router = express.Router();

const airportController = require('../controllers/airportController');
const { authenticateToken, restrictTo } = require('../middleware/auth');
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

// Admin-only routes
router.use(restrictTo('admin')); // Apply admin restriction to all routes below

// Airport CRUD operations
router.get('/', validatePagination, airportController.getAllAirports);
router.get('/stats', airportController.getAirportStats);
router.get('/search', validateAirportSearch, airportController.searchAirports);
router.get('/code/:code', validateAirportCode, airportController.getAirportByCode);
router.get('/:id', validateAirportId, airportController.getAirportById);
router.post('/', validateAirportCreation, airportController.createAirport);
router.post('/bulk-import', validateBulkAirportImport, airportController.bulkImportAirports);
router.put('/:id', validateAirportId, validateAirportUpdate, airportController.updateAirport);
router.delete('/:id', validateAirportId, airportController.deleteAirport);

// Airport status management
router.patch('/:id/activate', validateAirportId, airportController.activateAirport);
router.patch('/:id/deactivate', validateAirportId, airportController.deactivateAirport);

module.exports = router; 