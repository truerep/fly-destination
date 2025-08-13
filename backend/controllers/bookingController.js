const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');

class BookingController {
  async searchTickets(req, res) {
    try {
      const { from, to, date, page = 1, limit = 20 } = req.query;

      if (!from || !to || !date) {
        return ResponseHandler.validationError(res, [
          { field: 'from', message: 'from is required', value: from },
          { field: 'to', message: 'to is required', value: to },
          { field: 'date', message: 'date is required', value: date }
        ]);
      }

      const day = new Date(date);
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);

      const query = {
        fromAirport: from.toUpperCase(),
        toAirport: to.toUpperCase(),
        departureTime: { $gte: start, $lte: end },
        isActive: true,
        quantityAvailable: { $gt: 0 }
      };

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
      return ResponseHandler.error(res, error.message || 'Failed to search tickets');
    }
  }

  async createBooking(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { ticketId, quantity, passengers, infants } = req.body;
      const agentId = req.user._id;

      if (!ticketId || !quantity || quantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.validationError(res, [
          { field: 'ticketId', message: 'ticketId is required', value: ticketId },
          { field: 'quantity', message: 'quantity must be > 0', value: quantity }
        ]);
      }

      const ticket = await Ticket.findById(ticketId).session(session);
      if (!ticket || !ticket.isActive) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.notFound(res, 'Ticket not found or inactive');
      }

      if (ticket.quantityAvailable < quantity) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.validationError(res, [
          { field: 'quantity', message: 'Requested quantity exceeds availability', value: quantity }
        ]);
      }

      // Pricing: admin base + agent marker
      const unitBasePrice = ticket.basePrice;

      const agent = await User.findById(agentId).session(session);
      const markerAmount = Number(agent.markerAmount || 0);
      const finalUnitSellingPrice = unitBasePrice + markerAmount;

      const totalSellingPrice = finalUnitSellingPrice * quantity;
      const totalBasePrice = unitBasePrice * quantity;

      // Funds check (balance + available credit >= admin price total)
      const balance = Number(agent.balance || 0);
      const creditLimit = Number(agent.creditLimit || 0);
      const creditUsed = Number(agent.creditUsed || 0);
      const availableCredit = Math.max(0, creditLimit - creditUsed);

      // Require funds to cover admin base total only
      const requiredFunds = totalBasePrice;
      const availableFunds = balance + availableCredit;
      if (availableFunds < requiredFunds) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.forbidden(res, 'Insufficient funds');
      }

      // Deduct funds: prefer balance, then credit
      let remaining = totalSellingPrice;
      let newBalance = balance;
      let newCreditUsed = creditUsed;
      if (newBalance >= remaining) {
        newBalance -= remaining;
        remaining = 0;
      } else {
        remaining -= newBalance;
        newBalance = 0;
        newCreditUsed += remaining; // consume credit
        remaining = 0;
      }

      agent.balance = newBalance;
      agent.creditUsed = newCreditUsed;
      await agent.save({ session });

      // Reserve inventory
      ticket.quantityAvailable -= quantity;
      await ticket.save({ session });

      // Generate unique booking reference FTDXXXXXX
      let reference;
      let attempts = 0;
      const maxAttempts = 10;
      do {
        const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6 digits
        reference = `FTD${randomNumber}`;
        const existing = await Booking.findOne({ reference }).session(session);
        if (!existing) break;
        attempts++;
      } while (attempts < maxAttempts);
      if (attempts === maxAttempts) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.error(res, 'Failed to generate unique booking reference');
      }

      const booking = await Booking.create([{
        ticket: ticket._id,
        agent: agent._id,
        quantity,
        infants: Number(infants || 0),
        unitBasePrice,
        unitSellingPrice: finalUnitSellingPrice,
        totalBasePrice,
        totalSellingPrice,
        passengers: passengers || [],
        reference,
        createdBy: req.user._id
      }], { session });

      await session.commitTransaction();
      session.endSession();
      return ResponseHandler.success(res, booking[0], 'Booking created', 201);
    } catch (error) {
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
      return ResponseHandler.error(res, error.message || 'Failed to create booking');
    }
  }

  async listMyBookings(req, res) {
    try {
      const { page = 1, limit = 20, q, reference, pnr } = req.query;

      const andFilters = [{ agent: req.user._id }];

      if (reference) {
        andFilters.push({ reference: new RegExp(`^${reference}$`, 'i') });
      }

      // Resolve PNR or q to ticket IDs
      let ticketFilterIds = [];
      const pnrQuery = pnr || undefined;
      const qQuery = q || undefined;
      if (pnrQuery || qQuery) {
        const ticketQuery = {};
        if (pnrQuery) {
          ticketQuery.pnr = new RegExp(pnrQuery, 'i');
        } else if (qQuery) {
          // If q provided but not reference, use q for pnr match as well
          ticketQuery.pnr = new RegExp(qQuery, 'i');
        }
        if (ticketQuery.pnr) {
          const tickets = await Ticket.find(ticketQuery).select('_id');
          ticketFilterIds = tickets.map(t => t._id);
          if (ticketFilterIds.length === 0) {
            return ResponseHandler.success(res, { items: [], page: Number(page), limit: Number(limit), total: 0, totalPages: 0 });
          }
          andFilters.push({ ticket: { $in: ticketFilterIds } });
        }
      }

      const filter = andFilters.length ? { $and: andFilters } : {};

      const bookings = await Booking.find(filter)
        .populate('ticket')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Booking.countDocuments(filter);
      return ResponseHandler.success(res, {
        items: bookings,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch bookings');
    }
  }

  async requestNameChange(req, res) {
    try {
      const { id } = req.params; // booking id
      const { note } = req.body;

      const booking = await Booking.findOne({ _id: id, agent: req.user._id });
      if (!booking) return ResponseHandler.notFound(res, 'Booking not found');

      if (booking.nameChangeRequest?.requested && booking.nameChangeRequest.status === 'pending') {
        return ResponseHandler.validationError(res, [
          { field: 'nameChangeRequest', message: 'A pending request already exists', value: true }
        ]);
      }

      booking.nameChangeRequest = {
        requested: true,
        requestedAt: new Date(),
        requestedBy: req.user._id,
        status: 'pending',
        note: note || ''
      };
      await booking.save();
      return ResponseHandler.success(res, booking, 'Name change requested');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to request name change');
    }
  }

  // Admin approves/rejects and can update passenger names
  async processNameChange(req, res) {
    try {
      const { id } = req.params; // booking id
      const { action, passengers, note } = req.body; // action: 'approve' | 'reject'

      const booking = await Booking.findById(id).populate('ticket');
      if (!booking) return ResponseHandler.notFound(res, 'Booking not found');

      if (!booking.nameChangeRequest?.requested || booking.nameChangeRequest.status !== 'pending') {
        return ResponseHandler.validationError(res, [
          { field: 'nameChangeRequest', message: 'No pending request to process', value: false }
        ]);
      }

      if (action === 'approve') {
        if (!Array.isArray(passengers) || passengers.length !== booking.quantity) {
          return ResponseHandler.validationError(res, [
            { field: 'passengers', message: 'Passengers array must match quantity', value: passengers?.length }
          ]);
        }
        booking.passengers = passengers;
        booking.nameChangeRequest.status = 'approved';
      } else if (action === 'reject') {
        booking.nameChangeRequest.status = 'rejected';
      } else {
        return ResponseHandler.validationError(res, [
          { field: 'action', message: "action must be 'approve' or 'reject'", value: action }
        ]);
      }

      booking.nameChangeRequest.processedAt = new Date();
      booking.nameChangeRequest.processedBy = req.user._id;
      booking.nameChangeRequest.note = note || booking.nameChangeRequest.note;

      await booking.save();
      return ResponseHandler.success(res, booking, 'Name change request processed');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to process name change');
    }
  }

  async listAllBookings(req, res) {
    try {
      const { page = 1, limit = 20, q, reference, pnr, partner } = req.query;

      const andFilters = [];

      if (reference) {
        andFilters.push({ reference: new RegExp(`^${reference}$`, 'i') });
      } else if (q) {
        // Allow partial reference search
        andFilters.push({ reference: new RegExp(q, 'i') });
      }

      // PNR search -> resolve to ticket IDs
      if (pnr || (q && !reference)) {
        const pnrRegex = new RegExp(pnr || q, 'i');
        const tickets = await Ticket.find({ pnr: pnrRegex }).select('_id');
        if (tickets.length > 0) {
          andFilters.push({ ticket: { $in: tickets.map(t => t._id) } });
        }
      }

      // Partner search -> resolve to agent IDs
      if (partner || (q && !reference)) {
        const partnerRegex = new RegExp(partner || q, 'i');
        const users = await User.find({
          userType: 'agent',
          $or: [
            { companyName: partnerRegex },
            { contactPersonName: partnerRegex },
            { agentId: partnerRegex },
            { email: partnerRegex },
            { phoneNumber: partnerRegex },
          ]
        }).select('_id');
        if (users.length > 0) {
          andFilters.push({ agent: { $in: users.map(u => u._id) } });
        }
      }

      const filter = andFilters.length ? { $and: andFilters } : {};

      const bookings = await Booking.find(filter)
        .populate('ticket')
        .populate({ path: 'agent', select: 'agentId companyName contactPersonName email phoneNumber' })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Booking.countDocuments(filter);
      return ResponseHandler.success(res, {
        items: bookings,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch all bookings');
    }
  }
}

module.exports = new BookingController();


