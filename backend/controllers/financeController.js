const mongoose = require('mongoose');
const User = require('../models/User');
const FinanceRequest = require('../models/FinanceRequest');
const FinanceTransaction = require('../models/FinanceTransaction');
const ResponseHandler = require('../utils/responseHandler');

class FinanceController {
  async getMyFinance(req, res) {
    try {
      const user = await User.findById(req.user._id).select('totalCreditLimit availableCreditLimit markerAmount balanceDue');
      if (!user) return ResponseHandler.notFound(res, 'User not found');
      return ResponseHandler.success(res, {
        totalCreditLimit: Number(user.totalCreditLimit || 0),
        availableCreditLimit: Number(user.availableCreditLimit || 0),
        markerAmount: Number(user.markerAmount || 0),
        balanceDue: Number(user.balanceDue || 0)
      });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch finance');
    }
  }

  async requestFinance(req, res) {
    try {
      const { type, amount, note, paymentScreenshotBase64, paymentReference } = req.body;
      if (!['totalCreditLimit', 'availableCreditLimit', 'balanceDueSettlement'].includes(type)) {
        return ResponseHandler.validationError(res, [{ field: 'type', message: "type must be 'totalCreditLimit' | 'availableCreditLimit' | 'balanceDueSettlement'", value: type }]);
      }
      if (!amount || Number(amount) <= 0) {
        return ResponseHandler.validationError(res, [{ field: 'amount', message: 'amount must be > 0', value: amount }]);
      }
      // If base64 provided, upload and set URL
      let finalScreenshotUrl = undefined;
      if (paymentScreenshotBase64) {
        try {
          const { uploadBase64Image } = require('../services/uploadService');
          const up = await uploadBase64Image(paymentScreenshotBase64);
          finalScreenshotUrl = up?.url || undefined;
        } catch (_) {}
      }

      const fr = await FinanceRequest.create({
        agent: req.user._id,
        type,
        amount: Number(amount),
        note: note || '',
        paymentScreenshotUrl: finalScreenshotUrl || undefined,
        paymentReference: paymentReference || undefined,
        createdBy: req.user._id
      });
      return ResponseHandler.success(res, fr, 'Request created', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to create request');
    }
  }

  async listMyRequests(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const filter = { agent: req.user._id };
      if (status) filter.status = status;
      const items = await FinanceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
      const total = await FinanceRequest.countDocuments(filter);
      return ResponseHandler.success(res, { items, page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch requests');
    }
  }

  async adminListRequests(req, res) {
    try {
      const { page = 1, limit = 20, q, status, type } = req.query;
      const andFilters = [];
      if (status) andFilters.push({ status });
      if (type) andFilters.push({ type });
      if (q) {
        const users = await User.find({
          userType: 'agent',
          $or: [
            { companyName: new RegExp(q, 'i') },
            { contactPersonName: new RegExp(q, 'i') },
            { agentId: new RegExp(q, 'i') },
            { email: new RegExp(q, 'i') },
            { phoneNumber: new RegExp(q, 'i') }
          ]
        }).select('_id');
        if (users.length > 0) andFilters.push({ agent: { $in: users.map(u => u._id) } });
      }
      const filter = andFilters.length ? { $and: andFilters } : {};
      const items = await FinanceRequest.find(filter)
        .populate({ path: 'agent', select: 'agentId companyName contactPersonName email phoneNumber totalCreditLimit availableCreditLimit' })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
      const total = await FinanceRequest.countDocuments(filter);
      return ResponseHandler.success(res, { items, page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch requests');
    }
  }

  async adminProcessRequest(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;
      const { action, note } = req.body; // action: 'approve' | 'reject'
      const fr = await FinanceRequest.findById(id).session(session);
      if (!fr) {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.notFound(res, 'Request not found');
      }
      if (fr.status !== 'pending') {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.validationError(res, [{ field: 'status', message: 'Request already processed', value: fr.status }]);
      }

      if (action === 'approve') {
        const user = await User.findById(fr.agent).session(session);
        if (!user) {
          await session.abortTransaction();
          session.endSession();
          return ResponseHandler.notFound(res, 'Agent not found');
        }
        if (fr.type === 'totalCreditLimit') {
          const beforeTotal = Number(user.totalCreditLimit || 0);
          const delta = Number(fr.amount || 0);
          user.totalCreditLimit = Math.max(0, beforeTotal + delta);
          const txs = [];
          txs.push({
            agent: user._id,
            kind: 'totalCreditLimit',
            amount: user.totalCreditLimit - beforeTotal,
            valueBefore: beforeTotal,
            valueAfter: user.totalCreditLimit,
            action: 'request_approve',
            referenceType: 'FinanceRequest',
            referenceId: fr._id,
            note: note || fr.note,
            source: 'admin',
            createdBy: req.user._id,
            availableAfter: Number(user.availableCreditLimit || 0),
            totalAfter: Number(user.totalCreditLimit || 0)
          });
          if (delta > 0) {
            const beforeAvail = Number(user.availableCreditLimit || 0);
            user.availableCreditLimit = Math.max(0, beforeAvail + delta);
            txs.push({
              agent: user._id,
              kind: 'availableCreditLimit',
              amount: user.availableCreditLimit - beforeAvail,
              valueBefore: beforeAvail,
              valueAfter: user.availableCreditLimit,
              action: 'request_approve',
              referenceType: 'FinanceRequest',
              referenceId: fr._id,
              note: `Auto increase available with total +${delta}`,
              source: 'admin',
              createdBy: req.user._id,
              availableAfter: Number(user.availableCreditLimit || 0),
              totalAfter: Number(user.totalCreditLimit || 0)
            });
          }
          await FinanceTransaction.create(txs, { session });
        } else if (fr.type === 'availableCreditLimit') {
          const before = Number(user.availableCreditLimit || 0);
          const delta = Number(fr.amount || 0);
          user.availableCreditLimit = Math.max(0, before + delta);
          await FinanceTransaction.create([
            {
              agent: user._id,
              kind: 'availableCreditLimit',
              amount: user.availableCreditLimit - before,
              valueBefore: before,
              valueAfter: user.availableCreditLimit,
              action: 'request_approve',
              referenceType: 'FinanceRequest',
              referenceId: fr._id,
              note: note || fr.note,
              source: 'admin',
              createdBy: req.user._id,
              availableAfter: Number(user.availableCreditLimit || 0),
              totalAfter: Number(user.totalCreditLimit || 0)
            }
          ], { session });
        } else if (fr.type === 'balanceDueSettlement') {
          const user = await User.findById(fr.agent).session(session);
          const beforeDue = Number(user.balanceDue || 0);
          const delta = Number(fr.amount || 0);
          const afterDue = beforeDue - delta; // can go negative to reflect overpayment
          user.balanceDue = afterDue;
          await FinanceTransaction.create([
            {
              agent: user._id,
              kind: 'balanceDue',
              amount: -delta,
              valueBefore: beforeDue,
              valueAfter: afterDue,
              action: 'settlement_approve',
              referenceType: 'FinanceRequest',
              referenceId: fr._id,
              note: note || fr.note,
              source: 'admin',
              createdBy: req.user._id,
              availableAfter: Number(user.availableCreditLimit || 0),
              totalAfter: Number(user.totalCreditLimit || 0)
            }
          ], { session });
          await user.save({ session });
        }
        await user.save({ session });
        fr.status = 'approved';
      } else if (action === 'reject') {
        fr.status = 'rejected';
      } else {
        await session.abortTransaction();
        session.endSession();
        return ResponseHandler.validationError(res, [{ field: 'action', message: "action must be 'approve' or 'reject'", value: action }]);
      }

      fr.note = note || fr.note;
      fr.processedAt = new Date();
      fr.processedBy = req.user._id;
      await fr.save({ session });

      await session.commitTransaction();
      session.endSession();
      return ResponseHandler.success(res, fr, 'Request processed');
    } catch (error) {
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
      return ResponseHandler.error(res, error.message || 'Failed to process request');
    }
  }

  async adminAdjustFinance(req, res) {
    try {
      const { agentId } = req.params; // can be FD1234 or MongoID
      const { totalCreditLimitDelta, availableCreditLimitDelta, balanceDueDelta, note } = req.body;
      let user = null;
      if (/^FD\d{4}$/i.test(agentId)) {
        user = await User.findOne({ agentId: agentId.toUpperCase() });
      } else {
        user = await User.findById(agentId);
      }
      if (!user || user.userType !== 'agent') return ResponseHandler.notFound(res, 'Agent not found');

      if (typeof totalCreditLimitDelta !== 'undefined') {
        const beforeTotal = Number(user.totalCreditLimit || 0);
        const delta = Number(totalCreditLimitDelta);
        const afterTotal = Math.max(0, beforeTotal + delta);
        user.totalCreditLimit = afterTotal;
        const txs = [];
        txs.push({
          agent: user._id,
          kind: 'totalCreditLimit',
          amount: afterTotal - beforeTotal,
          valueBefore: beforeTotal,
          valueAfter: afterTotal,
          action: 'adjust',
          referenceType: 'Manual',
          note: `Manual total credit limit adjust Δ ${delta}`,
          source: 'admin',
          createdBy: req.user._id,
          availableAfter: Number(user.availableCreditLimit || 0),
          totalAfter: Number(afterTotal || 0)
        });
        if (delta > 0) {
          const beforeAvail = Number(user.availableCreditLimit || 0);
          const afterAvail = Math.max(0, beforeAvail + delta);
          user.availableCreditLimit = afterAvail;
          txs.push({
            agent: user._id,
            kind: 'availableCreditLimit',
            amount: afterAvail - beforeAvail,
            valueBefore: beforeAvail,
            valueAfter: afterAvail,
            action: 'adjust',
            referenceType: 'Manual',
            note: `Auto increase available with total +${delta}`,
            source: 'admin',
            createdBy: req.user._id,
            availableAfter: Number(afterAvail || 0),
            totalAfter: Number(afterTotal || 0)
          });
        }
        await FinanceTransaction.create(txs);
      }
      if (typeof availableCreditLimitDelta !== 'undefined') {
        const before = Number(user.availableCreditLimit || 0);
        const delta = Number(availableCreditLimitDelta);
        const after = Math.max(0, before + delta);
        user.availableCreditLimit = after;
        await FinanceTransaction.create({
          agent: user._id,
          kind: 'availableCreditLimit',
          amount: after - before,
          valueBefore: before,
          valueAfter: after,
          action: 'adjust',
          referenceType: 'Manual',
          note: `Manual available credit adjust Δ ${delta}`,
          source: 'admin',
          createdBy: req.user._id,
          availableAfter: Number(after || 0),
          totalAfter: Number(user.totalCreditLimit || 0)
        });
      }
      if (typeof balanceDueDelta !== 'undefined') {
        const beforeDue = Number(user.balanceDue || 0);
        const delta = Number(balanceDueDelta);
        const afterDue = beforeDue + delta; // can be +/-, allow negative (advance)
        user.balanceDue = afterDue;
        await FinanceTransaction.create({
          agent: user._id,
          kind: 'balanceDue',
          amount: delta,
          valueBefore: beforeDue,
          valueAfter: afterDue,
          action: 'adjust',
          referenceType: 'Manual',
          note: note || `Manual balance due adjust Δ ${delta}`,
          source: 'admin',
          createdBy: req.user._id,
          availableAfter: Number(user.availableCreditLimit || 0),
          totalAfter: Number(user.totalCreditLimit || 0)
        });
      }
      await user.save();
      return ResponseHandler.success(res, user.toPublicJSON(), 'Finance updated');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to update finance');
    }
  }

  async adminReceivables(req, res) {
    try {
      // Receivable = totalCreditLimit - availableCreditLimit
      const agents = await User.find({ userType: 'agent' }).select('agentId companyName contactPersonName email phoneNumber totalCreditLimit availableCreditLimit');
      const items = agents.map(a => ({
        agentId: a.agentId,
        companyName: a.companyName,
        contactPersonName: a.contactPersonName,
        email: a.email,
        phoneNumber: a.phoneNumber,
        totalCreditLimit: Number(a.totalCreditLimit || 0),
        availableCreditLimit: Number(a.availableCreditLimit || 0),
        receivable: Math.max(0, Number(a.totalCreditLimit || 0) - Number(a.availableCreditLimit || 0))
      }));
      return ResponseHandler.success(res, { items });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to compute receivables');
    }
  }

  async listTransactionsAdmin(req, res) {
    try {
      const { page = 1, limit = 20, q, agentId } = req.query;
      const andFilters = [];
      if (agentId) {
        if (/^FD\d{4}$/i.test(agentId)) {
          const users = await User.find({ agentId: agentId.toUpperCase() }).select('_id');
          if (users.length > 0) andFilters.push({ agent: { $in: users.map(u => u._id) } });
          else return ResponseHandler.success(res, { items: [], page: Number(page), limit: Number(limit), total: 0, totalPages: 0 });
        } else if (mongoose.isValidObjectId(agentId)) {
          andFilters.push({ agent: agentId });
        }
      }
      if (q) {
        const users = await User.find({
          userType: 'agent',
          $or: [
            { companyName: new RegExp(q, 'i') },
            { contactPersonName: new RegExp(q, 'i') },
            { agentId: new RegExp(q, 'i') },
            { email: new RegExp(q, 'i') },
            { phoneNumber: new RegExp(q, 'i') }
          ]
        }).select('_id');
        if (users.length > 0) andFilters.push({ agent: { $in: users.map(u => u._id) } });
        else return ResponseHandler.success(res, { items: [], page: Number(page), limit: Number(limit), total: 0, totalPages: 0 });
      }
      const filter = andFilters.length ? { $and: andFilters } : {};
      const items = await FinanceTransaction.find(filter)
        .populate({ path: 'agent', select: 'agentId companyName contactPersonName email phoneNumber' })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
      const total = await FinanceTransaction.countDocuments(filter);
      return ResponseHandler.success(res, { items, page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch transactions');
    }
  }

  async listMyTransactions(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const filter = { agent: req.user._id };
      const items = await FinanceTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
      const total = await FinanceTransaction.countDocuments(filter);
      return ResponseHandler.success(res, { items, page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to fetch my transactions');
    }
  }
}

module.exports = new FinanceController();


