const Ticket = require('../models/Ticket');
const ResponseHandler = require('../utils/responseHandler');

class TicketController {
  async createTicket(req, res) {
    try {
      const ticket = await Ticket.create({
        ...req.body,
        createdBy: req.user._id
      });
      return ResponseHandler.success(res, ticket, 'Ticket created', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to create ticket');
    }
  }

  async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const ticket = await Ticket.findByIdAndUpdate(
        id,
        { ...req.body, updatedBy: req.user._id },
        { new: true }
      );
      if (!ticket) return ResponseHandler.notFound(res, 'Ticket not found');
      return ResponseHandler.success(res, ticket, 'Ticket updated');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to update ticket');
    }
  }

  async deleteTicket(req, res) {
    try {
      const { id } = req.params;
      const ticket = await Ticket.findByIdAndDelete(id);
      if (!ticket) return ResponseHandler.notFound(res, 'Ticket not found');
      return ResponseHandler.success(res, null, 'Ticket deleted');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to delete ticket');
    }
  }

  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = await Ticket.findById(id);
      if (!ticket) return ResponseHandler.notFound(res, 'Ticket not found');
      return ResponseHandler.success(res, ticket);
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch ticket');
    }
  }

  async listTickets(req, res) {
    try {
      const { page = 1, limit = 20, from, to, date, airline, isActive, pnr, q } = req.query;
      const query = {};

      if (from) query.fromAirport = from.toUpperCase();
      if (to) query.toAirport = to.toUpperCase();
      if (airline) query.airline = new RegExp(airline, 'i');
      if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';
      if (pnr) query.pnr = new RegExp(pnr, 'i');
      if (q && !pnr) {
        // fallback generic search: tries airline, pnr, route
        query.$or = [
          { airline: new RegExp(q, 'i') },
          { pnr: new RegExp(q, 'i') },
          { fromAirport: new RegExp(q, 'i') },
          { toAirport: new RegExp(q, 'i') },
          { flightNumber: new RegExp(q, 'i') },
        ];
      }
      if (date) {
        const day = new Date(date);
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        query.departureTime = { $gte: start, $lte: end };
      }

      const tickets = await Ticket.find(query)
        .sort({ departureTime: 1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Ticket.countDocuments(query);

      return ResponseHandler.success(res, {
        items: tickets,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to list tickets');
    }
  }
}

module.exports = new TicketController();


