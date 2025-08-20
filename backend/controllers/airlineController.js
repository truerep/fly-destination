const Airline = require('../models/Airline');
const ResponseHandler = require('../utils/responseHandler');

class AirlineController {
  async list(req, res) {
    try {
      const { page = 1, limit = 50, q, isActive } = req.query;
      const filter = {};
      if (q) filter.name = new RegExp(q, 'i');
      if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
      const items = await Airline.find(filter).sort({ name: 1 }).skip((Number(page)-1)*Number(limit)).limit(Number(limit));
      const total = await Airline.countDocuments(filter);
      return ResponseHandler.success(res, { items, page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total/Number(limit)) });
    } catch (e) { return ResponseHandler.error(res, e.message || 'Failed to list airlines'); }
  }

  async create(req, res) {
    try {
      const { name, logoBase64, logoUrl } = req.body;
      if (!name) return ResponseHandler.validationError(res, [{ field: 'name', message: 'name is required' }]);
      const data = { name: name.trim(), createdBy: req.user._id };
      if (logoUrl) data.logoUrl = logoUrl;
      if (logoBase64) {
        try {
          const { uploadBase64Image } = require('../services/uploadService');
          const up = await uploadBase64Image(logoBase64);
          if (!up?.url) {
            return ResponseHandler.error(res, 'Image upload failed');
          }
          data.logoUrl = up.url;
        } catch (e) {
          return ResponseHandler.error(res, e.message || 'Image upload failed');
        }
      }
      const airline = await Airline.create(data);
      return ResponseHandler.success(res, airline, 'Airline created', 201);
    } catch (e) { return ResponseHandler.error(res, e.message || 'Failed to create airline'); }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, logoBase64, logoUrl, isActive } = req.body;
      const data = { updatedBy: req.user._id };
      if (typeof name !== 'undefined') data.name = name;
      if (typeof isActive !== 'undefined') data.isActive = !!isActive;
      if (logoUrl) data.logoUrl = logoUrl;
      if (logoBase64) {
        try {
          const { uploadBase64Image } = require('../services/uploadService');
          const up = await uploadBase64Image(logoBase64);
          if (!up?.url) {
            return ResponseHandler.error(res, 'Image upload failed');
          }
          data.logoUrl = up.url;
        } catch (e) {
          return ResponseHandler.error(res, e.message || 'Image upload failed');
        }
      }
      const airline = await Airline.findByIdAndUpdate(id, data, { new: true });
      if (!airline) return ResponseHandler.notFound(res, 'Airline not found');
      return ResponseHandler.success(res, airline, 'Airline updated');
    } catch (e) { return ResponseHandler.error(res, e.message || 'Failed to update airline'); }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;
      const air = await Airline.findByIdAndDelete(id);
      if (!air) return ResponseHandler.notFound(res, 'Airline not found');
      return ResponseHandler.success(res, null, 'Airline deleted');
    } catch (e) { return ResponseHandler.error(res, e.message || 'Failed to delete airline'); }
  }
}

module.exports = new AirlineController();


