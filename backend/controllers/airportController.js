const Airport = require('../models/Airport');
const ResponseHandler = require('../utils/responseHandler');

class AirportController {
  /**
   * Get all airports with pagination and filtering
   */
  async getAllAirports(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }
      if (req.query.country) {
        filter.country = { $regex: req.query.country, $options: 'i' };
      }
      if (req.query.city) {
        filter.city = { $regex: req.query.city, $options: 'i' };
      }
      if (req.query.search) {
        filter.$or = [
          { airportCode: { $regex: req.query.search, $options: 'i' } },
          { airportName: { $regex: req.query.search, $options: 'i' } },
          { city: { $regex: req.query.search, $options: 'i' } },
          { country: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const airports = await Airport.find(filter)
        .populate('createdBy', 'email userType')
        .populate('updatedBy', 'email userType')
        .sort({ airportCode: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Airport.countDocuments(filter);

      return ResponseHandler.success(res, {
        airports,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }, 'Airports retrieved successfully');

    } catch (error) {
      console.error('Get all airports error:', error);
      return ResponseHandler.error(res, 'Failed to retrieve airports');
    }
  }

  /**
   * Get airport by ID
   */
  async getAirportById(req, res) {
    try {
      const { id } = req.params;

      const airport = await Airport.findById(id)
        .populate('createdBy', 'email userType')
        .populate('updatedBy', 'email userType');

      if (!airport) {
        return ResponseHandler.notFound(res, 'Airport not found');
      }

      return ResponseHandler.success(res, {
        airport
      }, 'Airport retrieved successfully');

    } catch (error) {
      console.error('Get airport by ID error:', error);
      return ResponseHandler.error(res, 'Failed to retrieve airport');
    }
  }

  /**
   * Get airport by airport code
   */
  async getAirportByCode(req, res) {
    try {
      const { code } = req.params;

      const airport = await Airport.findOne({ 
        airportCode: code.toUpperCase() 
      }).populate('createdBy', 'email userType')
        .populate('updatedBy', 'email userType');

      if (!airport) {
        return ResponseHandler.notFound(res, 'Airport not found');
      }

      return ResponseHandler.success(res, {
        airport
      }, 'Airport retrieved successfully');

    } catch (error) {
      console.error('Get airport by code error:', error);
      return ResponseHandler.error(res, 'Failed to retrieve airport');
    }
  }

  /**
   * Create new airport
   */
  async createAirport(req, res) {
    try {
      const {
        airportCode,
        airportName,
        city,
        country,
        state,
      } = req.body;

      // Check if airport with same code already exists
      const existingAirport = await Airport.findOne({ 
        airportCode: airportCode.toUpperCase() 
      });

      if (existingAirport) {
        return ResponseHandler.conflict(res, 'Airport with this code already exists');
      }

      // Create new airport
      const airportData = {
        airportCode,
        airportName,
        city,
        country,
        state,
        createdBy: req.user._id
      };

      const airport = new Airport(airportData);
      await airport.save();

      // Populate createdBy field
      await airport.populate('createdBy', 'email userType');

      return ResponseHandler.success(res, {
        airport
      }, 'Airport created successfully', 201);

    } catch (error) {
      console.error('Create airport error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return ResponseHandler.validationError(res, errors);
      }
      
      return ResponseHandler.error(res, 'Failed to create airport');
    }
  }

  /**
   * Update airport
   */
  async updateAirport(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.createdBy;
      delete updateData.createdAt;

      // Add updatedBy field
      updateData.updatedBy = req.user._id;

      const airport = await Airport.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'email userType')
       .populate('updatedBy', 'email userType');

      if (!airport) {
        return ResponseHandler.notFound(res, 'Airport not found');
      }

      return ResponseHandler.success(res, {
        airport
      }, 'Airport updated successfully');

    } catch (error) {
      console.error('Update airport error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return ResponseHandler.validationError(res, errors);
      }
      
      return ResponseHandler.error(res, 'Failed to update airport');
    }
  }

  /**
   * Delete airport
   */
  async deleteAirport(req, res) {
    try {
      const { id } = req.params;

      const airport = await Airport.findById(id);
      if (!airport) {
        return ResponseHandler.notFound(res, 'Airport not found');
      }

      await Airport.findByIdAndDelete(id);

      return ResponseHandler.success(res, null, 'Airport deleted successfully');

    } catch (error) {
      console.error('Delete airport error:', error);
      return ResponseHandler.error(res, 'Failed to delete airport');
    }
  }

  /**
   * Activate airport
   */
  async activateAirport(req, res) {
    try {
      const { id } = req.params;

      const airport = await Airport.findById(id);
      if (!airport) {
        return ResponseHandler.notFound(res, 'Airport not found');
      }

      airport.isActive = true;
      airport.updatedBy = req.user._id;
      await airport.save();

      await airport.populate('createdBy', 'email userType');
      await airport.populate('updatedBy', 'email userType');

      return ResponseHandler.success(res, {
        airport
      }, 'Airport activated successfully');

    } catch (error) {
      console.error('Activate airport error:', error);
      return ResponseHandler.error(res, 'Failed to activate airport');
    }
  }

  /**
   * Deactivate airport
   */
  async deactivateAirport(req, res) {
    try {
      const { id } = req.params;

      const airport = await Airport.findById(id);
      if (!airport) {
        return ResponseHandler.notFound(res, 'Airport not found');
      }

      airport.isActive = false;
      airport.updatedBy = req.user._id;
      await airport.save();

      await airport.populate('createdBy', 'email userType');
      await airport.populate('updatedBy', 'email userType');

      return ResponseHandler.success(res, {
        airport
      }, 'Airport deactivated successfully');

    } catch (error) {
      console.error('Deactivate airport error:', error);
      return ResponseHandler.error(res, 'Failed to deactivate airport');
    }
  }

  /**
   * Search airports
   */
  async searchAirports(req, res) {
    try {
      const { q, country, city, isActive } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const filter = {};
      
      if (q) {
        filter.$or = [
          { airportCode: { $regex: q, $options: 'i' } },
          { airportName: { $regex: q, $options: 'i' } },
          { city: { $regex: q, $options: 'i' } },
          { country: { $regex: q, $options: 'i' } }
        ];
      }

      if (country) filter.country = { $regex: country, $options: 'i' };
      if (city) filter.city = { $regex: city, $options: 'i' };
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const airports = await Airport.find(filter)
        .populate('createdBy', 'email userType')
        .populate('updatedBy', 'email userType')
        .sort({ airportCode: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Airport.countDocuments(filter);

      return ResponseHandler.success(res, {
        airports,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }, 'Search completed successfully');

    } catch (error) {
      console.error('Search airports error:', error);
      return ResponseHandler.error(res, 'Failed to search airports');
    }
  }

  /**
   * Get airport statistics
   */
  async getAirportStats(req, res) {
    try {
      const totalAirports = await Airport.countDocuments();
      const activeAirports = await Airport.countDocuments({ isActive: true });
      const inactiveAirports = await Airport.countDocuments({ isActive: false });

      // Get unique countries
      const countries = await Airport.distinct('country');
      const countryCount = countries.length;

      // Get unique cities
      const cities = await Airport.distinct('city');
      const cityCount = cities.length;

      const stats = {
        total: totalAirports,
        active: activeAirports,
        inactive: inactiveAirports,
        countries: countryCount,
        cities: cityCount
      };

      return ResponseHandler.success(res, {
        stats
      }, 'Airport statistics retrieved successfully');

    } catch (error) {
      console.error('Get airport stats error:', error);
      return ResponseHandler.error(res, 'Failed to retrieve airport statistics');
    }
  }

  /**
   * Bulk import airports (for admin convenience)
   */
  async bulkImportAirports(req, res) {
    try {
      const { airports } = req.body;

      if (!Array.isArray(airports) || airports.length === 0) {
        return ResponseHandler.validationError(res, ['Airports array is required and cannot be empty']);
      }

      const results = {
        created: 0,
        skipped: 0,
        errors: []
      };

      for (const airportData of airports) {
        try {
          // Check if airport already exists
          const existingAirport = await Airport.findOne({ 
            airportCode: airportData.airportCode.toUpperCase() 
          });

          if (existingAirport) {
            results.skipped++;
            continue;
          }

          // Create new airport
          const airport = new Airport({
            ...airportData,
            createdBy: req.user._id
          });

          await airport.save();
          results.created++;

        } catch (error) {
          results.errors.push({
            airportCode: airportData.airportCode,
            error: error.message
          });
        }
      }

      return ResponseHandler.success(res, {
        results
      }, `Bulk import completed. Created: ${results.created}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    } catch (error) {
      console.error('Bulk import airports error:', error);
      return ResponseHandler.error(res, 'Failed to import airports');
    }
  }
}

module.exports = new AirportController(); 