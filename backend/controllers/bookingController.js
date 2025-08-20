const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const FinanceTransaction = require('../models/FinanceTransaction');
const Airport = require('../models/Airport');
const ResponseHandler = require('../utils/responseHandler');
const emailService = require('../services/emailService');

class BookingController {
  async searchTickets(req, res) {
    try {
      const { from, to, date, page = 1, limit = 20, quantity } = req.query;

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
      if (quantity) {
        const qNum = Number(quantity);
        if (!Number.isNaN(qNum) && qNum > 0) {
          query.quantityAvailable = { $gte: qNum };
        }
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
      return ResponseHandler.error(res, error.message || 'Failed to search tickets');
    }
  }

  async createBooking(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { ticketId, quantity, passengers, infants, infantPassengers, promoCode } = req.body;
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
      const unitMarkup = Math.max(0, markerAmount);
      const finalUnitSellingPrice = unitBasePrice + unitMarkup;

      let totalSellingPrice = finalUnitSellingPrice * quantity;
      const totalBasePrice = unitBasePrice * quantity;
      const totalMarkup = unitMarkup * quantity;
      let baseDiscount = 0;
      let promoCodeUsed = null;

      // Apply promo code discount on BASE price (for funds check), not on selling price
      if (promoCode) {
        const now = new Date();
        const promo = await PromoCode.findOne({
          code: String(promoCode).toUpperCase(),
          isActive: true,
          $and: [
            { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
            { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] }
          ],
          $or: [
            { isGlobal: true },
            { agent: agent._id }
          ]
        }).session(session);
        if (!promo) {
          await session.abortTransaction();
          session.endSession();
          return ResponseHandler.validationError(res, [
            { field: 'promoCode', message: 'Invalid or inactive promo code', value: promoCode }
          ]);
        }
        
        promoCodeUsed = promo.code;

        let discount = 0;
        if (promo.isPercent) {
          discount = (totalSellingPrice * Number(promo.amount || 0)) / 100;
          if (typeof promo.maxDiscount === 'number') {
            discount = Math.min(discount, Number(promo.maxDiscount));
          }
        } else {
          discount = Number(promo.amount || 0);
        }
        baseDiscount = Math.max(0, Math.min(discount, totalBasePrice));
        const sellingDiscount = Math.max(0, Math.min(discount, totalSellingPrice));
        totalSellingPrice -= sellingDiscount;

        // Increase usage if usageLimit set
        if (typeof promo.usageLimit === 'number') {
          if (Number(promo.usageCount || 0) >= Number(promo.usageLimit)) {
            await session.abortTransaction();
            session.endSession();
            return ResponseHandler.validationError(res, [
              { field: 'promoCode', message: 'Promo code usage limit reached', value: promoCode }
            ]);
          }
          promo.usageCount = Number(promo.usageCount || 0) + 1;
          await promo.save({ session });
        }
      }

      // Funds check: available credit limit must cover (base - discount)
      const availableCredit = Number(agent.availableCreditLimit || 0);

      // Require funds to cover discounted base only
      const requiredFunds = Math.max(0, totalBasePrice - baseDiscount);
      if (availableCredit < requiredFunds) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.forbidden(res, 'Insufficient funds');
      }

      // Add infant fee (ticket.infantPrice per infant) to total selling only
      const infantsCount = Number(
        Array.isArray(infantPassengers) ? infantPassengers.length : (infants || 0)
      );
      if (infantsCount > 0) {
        const infantUnit = Number(ticket.infantPrice || 0);
        const infantsFee = infantUnit * infantsCount;
        totalSellingPrice += infantsFee;
      }

      // Deduct from available credit
      const beforeAvailable = availableCredit;
      const afterAvailable = Math.max(0, beforeAvailable - requiredFunds);
      await FinanceTransaction.create([
        {
          agent: agent._id,
          kind: 'availableCreditLimit',
          amount: afterAvailable - beforeAvailable,
          valueBefore: beforeAvailable,
          valueAfter: afterAvailable,
          action: 'booking',
          referenceType: 'Booking',
          note: `Booking funds deduction (available credit)`,
          availableAfter: Number(afterAvailable || 0),
          totalAfter: Number(agent.totalCreditLimit || 0)
        }
      ], { session });

      agent.availableCreditLimit = afterAvailable;
      // Increase balance due by the discounted base amount (receivable)
      const beforeDue = Number(agent.balanceDue || 0);
      const increaseDue = requiredFunds; // base - discount
      agent.balanceDue = Math.max(0, beforeDue + increaseDue);
      await FinanceTransaction.create([
        {
          agent: agent._id,
          kind: 'balanceDue',
          amount: increaseDue,
          valueBefore: beforeDue,
          valueAfter: agent.balanceDue,
          action: 'booking',
          referenceType: 'Booking',
          note: `Balance due increased for booking`,
          source: 'system',
          createdBy: req.user._id,
          availableAfter: Number(agent.availableCreditLimit || 0),
          totalAfter: Number(agent.totalCreditLimit || 0)
        }
      ], { session });
      await agent.save({ session });

      // Reserve inventory
      ticket.quantityAvailable -= quantity;
      ticket.quantityBooked = Number(ticket.quantityBooked || 0) + Number(quantity || 0);
      await ticket.save({ session });

      // Get airport city names
      const [fromAirport, toAirport] = await Promise.all([
        Airport.findOne({ airportCode: ticket.fromAirport, isActive: true }).session(session),
        Airport.findOne({ airportCode: ticket.toAirport, isActive: true }).session(session)
      ]);

      // Generate unique booking reference FTDXXXXXX
      let reference;
      let attempts = 0;
      const maxAttempts = 10;
      do {
        const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6 digits
        reference = `FDT${randomNumber}`;
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
        fromAirportCity: fromAirport?.city || ticket.fromAirport,
        toAirportCity: toAirport?.city || ticket.toAirport,
        quantity,
        infants: infantsCount,
        unitBasePrice,
        unitMarkup,
        unitSellingPrice: finalUnitSellingPrice,
        totalBasePrice,
        totalMarkup,
        totalSellingPrice,
        promoCode: promoCodeUsed,
        promoDiscount: baseDiscount,
        passengers: (passengers || []).map(p => ({
          firstName: p.firstName,
          lastName: p.lastName,
          salutation: p.salutation || p.gender, // fallback for legacy clients
          type: p.type || 'adult',
          dateOfBirth: p.dateOfBirth,
          passportNumber: p.passportNumber,
        })),
        infantPassengers: Array.isArray(infantPassengers) ? infantPassengers.map(ip => ({
          firstName: ip.firstName,
          lastName: ip.lastName,
          salutation: ip.salutation,
          dateOfBirth: ip.dateOfBirth,
        })) : [],
        reference,
        pnr: ticket.pnr || undefined,
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

  async getMyBookingById(req, res) {
    try {
      const { id } = req.params;
      const booking = await Booking.findOne({ _id: id, agent: req.user._id }).populate('ticket');
      if (!booking) return ResponseHandler.notFound(res, 'Booking not found');
      return ResponseHandler.success(res, booking);
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch booking');
    }
  }

  async updateMyBookingMarkup(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;
      const { unitMarkup } = req.body;
      const booking = await Booking.findOne({ _id: id, agent: req.user._id }).session(session);
      if (!booking) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.notFound(res, 'Booking not found');
      }

      // Recalculate totals: base remains same, markup changes; infants fee stays same
      const qty = Number(booking.quantity || 0);
      const infantsCount = Number(booking.infants || 0);
      const ticket = await Ticket.findById(booking.ticket).session(session);
      const infantUnit = Number(ticket?.infantPrice || 0);
      const unitBasePrice = Number(booking.unitBasePrice || 0);
      const newUnitMarkup = Math.max(0, Number(unitMarkup || 0));
      const newUnitSelling = unitBasePrice + newUnitMarkup;
      const totalBasePrice = unitBasePrice * qty;
      const totalMarkup = newUnitMarkup * qty;
      let totalSellingPrice = newUnitSelling * qty;
      if (infantsCount > 0) totalSellingPrice += infantUnit * infantsCount;

      booking.unitMarkup = newUnitMarkup;
      booking.unitSellingPrice = newUnitSelling;
      booking.totalBasePrice = totalBasePrice;
      booking.totalMarkup = totalMarkup;
      booking.totalSellingPrice = totalSellingPrice;
      booking.updatedBy = req.user._id;
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();
      return ResponseHandler.success(res, booking, 'Markup updated');
    } catch (error) {
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
      return ResponseHandler.error(res, error.message || 'Failed to update markup');
    }
  }

  async requestNameChange(req, res) {
    try {
      const { id } = req.params; // booking id
      const { passengers, note } = req.body; // new passengers entered by agent

      const booking = await Booking.findOne({ _id: id, agent: req.user._id });
      if (!booking) return ResponseHandler.notFound(res, 'Booking not found');

      if (!Array.isArray(passengers) || passengers.length !== Number(booking.quantity || 0)) {
        return ResponseHandler.validationError(res, [
          { field: 'passengers', message: 'Passengers array must match quantity', value: passengers?.length }
        ]);
      }

      const normalizedNewPassengers = (passengers || []).map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        salutation: p.salutation || p.gender, // fallback for legacy clients
        type: p.type || 'adult',
        dateOfBirth: p.dateOfBirth,
        passportNumber: p.passportNumber,
      }));

      booking.nameChangeRequests.push({
        previousPassengers: booking.passengers || [],
        newPassengers: normalizedNewPassengers,
        requestedAt: new Date(),
        requestedBy: req.user._id,
        status: 'pending',
        note: note || ''
      });
      // Keep legacy flag for compatibility
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
      const { action, passengers, note, requestId } = req.body; // action: 'approve' | 'reject', optional requestId

      const booking = await Booking.findById(id).populate('ticket');
      if (!booking) return ResponseHandler.notFound(res, 'Booking not found');

      // Pick the specific pending request (latest if not provided)
      const pendingList = (booking.nameChangeRequests || []).filter(r => r.status === 'pending');
      if (pendingList.length === 0) {
        return ResponseHandler.validationError(res, [{ field: 'nameChangeRequest', message: 'No pending request to process', value: false }]);
      }
      const reqIndex = requestId
        ? booking.nameChangeRequests.findIndex(r => String(r._id) === String(requestId) && r.status === 'pending')
        : booking.nameChangeRequests.findIndex(r => r.status === 'pending'); // first pending
      if (reqIndex === -1) {
        return ResponseHandler.validationError(res, [{ field: 'requestId', message: 'Invalid request id', value: requestId }]);
      }
      const target = booking.nameChangeRequests[reqIndex];

      if (action === 'approve') {
        if (!Array.isArray(passengers) || passengers.length !== booking.quantity) {
          return ResponseHandler.validationError(res, [
            { field: 'passengers', message: 'Passengers array must match quantity', value: passengers?.length }
          ]);
        }
        booking.passengers = (passengers || []).map(p => ({
          firstName: p.firstName,
          lastName: p.lastName,
          salutation: p.salutation || p.gender,
          type: p.type || 'adult',
          dateOfBirth: p.dateOfBirth,
          passportNumber: p.passportNumber,
        }));
        booking.nameChangeRequests[reqIndex].status = 'approved';
        booking.nameChangeRequests[reqIndex].processedAt = new Date();
        booking.nameChangeRequests[reqIndex].processedBy = req.user._id;
      } else if (action === 'reject') {
        booking.nameChangeRequests[reqIndex].status = 'rejected';
        booking.nameChangeRequests[reqIndex].processedAt = new Date();
        booking.nameChangeRequests[reqIndex].processedBy = req.user._id;
      } else {
        return ResponseHandler.validationError(res, [
          { field: 'action', message: "action must be 'approve' or 'reject'", value: action }
        ]);
      }

      // Update legacy flag to reflect latest status
      booking.nameChangeRequest.processedAt = new Date();
      booking.nameChangeRequest.processedBy = req.user._id;
      booking.nameChangeRequest.status = booking.nameChangeRequests[reqIndex].status;
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

      let filter = {};

      // If specific parameters are provided, use them
      if (reference) {
        filter.reference = new RegExp(`^${reference}$`, 'i');
      } else if (pnr) {
        // Search both booking PNR and ticket PNR
        const pnrRegex = new RegExp(pnr, 'i');
        const tickets = await Ticket.find({ pnr: pnrRegex }).select('_id');
        filter.$or = [
          { pnr: pnrRegex },
          { ticket: { $in: tickets.map(t => t._id) } }
        ];
      } else if (partner) {
        // Search by partner/agent
        const partnerRegex = new RegExp(partner, 'i');
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
          filter.agent = { $in: users.map(u => u._id) };
        }
      } else if (q) {
        // Generic search - try reference first, then PNR, then partner
        const searchRegex = new RegExp(q, 'i');
        
        // Try to find by reference
        const referenceMatch = await Booking.findOne({ reference: searchRegex });
        if (referenceMatch) {
          filter.reference = searchRegex;
        } else {
          // Try PNR search
          const tickets = await Ticket.find({ pnr: searchRegex }).select('_id');
          if (tickets.length > 0) {
            filter.$or = [
              { pnr: searchRegex },
              { ticket: { $in: tickets.map(t => t._id) } }
            ];
          } else {
            // Try partner search
            const users = await User.find({
              userType: 'agent',
              $or: [
                { companyName: searchRegex },
                { contactPersonName: searchRegex },
                { agentId: searchRegex },
                { email: searchRegex },
                { phoneNumber: searchRegex },
              ]
            }).select('_id');
            if (users.length > 0) {
              filter.agent = { $in: users.map(u => u._id) };
            }
          }
        }
      }

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

  async calendarTickets(req, res) {
    try {
      const { start, end, from, to, airline } = req.query;

      // Date range: default to current month if not provided
      let startDate;
      let endDate;
      if (start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
      } else {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        first.setHours(0, 0, 0, 0);
        last.setHours(23, 59, 59, 999);
        startDate = first;
        endDate = last;
      }

      // Build query for tickets in range and active with availability
      const query = {
        isActive: true,
        quantityAvailable: { $gt: 0 },
        departureTime: { $gte: startDate, $lte: endDate }
      };
      if (from) query.fromAirport = String(from).toUpperCase();
      if (to) query.toAirport = String(to).toUpperCase();
      if (airline) query.airline = new RegExp(airline, 'i');

      const tickets = await Ticket.find(query).sort({ departureTime: 1 });
      return ResponseHandler.success(res, { items: tickets });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch calendar tickets');
    }
  }

  /**
   * Send ticket email to agent
   */
  async sendTicketEmail(req, res) {
    try {
      const { id } = req.params;
      const { explicitTo } = req.body;

      const booking = await Booking.findById(id)
        .populate('ticket')
        .populate('agent');

      if (!booking) {
        return ResponseHandler.notFound(res, 'Booking not found');
      }

      // Check if user has access to this booking
      if (req.user.userType === 'agent') {
        const bookingAgentId = booking.agent?._id || booking.agent;
        if (bookingAgentId.toString() !== req.user._id.toString()) {
          return ResponseHandler.forbidden(res, 'Access denied');
        }
      }

      // Get airline logo if available
      let airlineLogoUrl = '';
      if (booking.ticket?.airline) {
        try {
          const airlineDoc = await Airline.findOne({ name: booking.ticket.airline });
          airlineLogoUrl = airlineDoc?.logoUrl || '';
        } catch (e) {
          // Non-fatal: continue without airline logo
        }
      }

      // Send email to both agent email and contact person email if different
      const emails = new Set();
      
      // Add agent's main email
      if (booking.agent?.email) {
        emails.add(booking.agent.email);
      }
      
      // Add contact person email if different from main email
      if (booking.agent?.contactPersonEmail && booking.agent.contactPersonEmail !== booking.agent.email) {
        emails.add(booking.agent.contactPersonEmail);
      }
      
      // Add explicit email if provided
      if (explicitTo) {
        emails.add(explicitTo);
      }

      // Send email to all addresses
      const emailPromises = Array.from(emails).map(email => 
        emailService.sendTicketEmail(booking._id, email)
      );

      await Promise.all(emailPromises);

      return ResponseHandler.success(res, null, `Ticket email sent to ${emails.size} recipient(s)`);

    } catch (error) {
      console.error('Send ticket email error:', error);
      return ResponseHandler.error(res, error.message || 'Failed to send ticket email');
    }
  }
}

module.exports = new BookingController();


