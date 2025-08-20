const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');

class PromoController {
  async createOrUpdate(req, res) {
    try {
      const { agent, agentId, code, amount, isPercent, maxDiscount, startsAt, endsAt, usageLimit, isActive } = req.body;
      if (!code) {
        return ResponseHandler.validationError(res, [
          { field: 'code', message: 'code is required', value: code }
        ]);
      }

      const codes = String(code).toUpperCase();
      const base = {
        code: codes,
        amount: Number(amount || 0),
        isPercent: Boolean(isPercent),
        maxDiscount: typeof maxDiscount !== 'undefined' ? Number(maxDiscount) : undefined,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        usageLimit: typeof usageLimit !== 'undefined' ? Number(usageLimit) : undefined,
        isActive: typeof isActive !== 'undefined' ? Boolean(isActive) : true,
        updatedBy: req.user._id,
        createdBy: req.user._id
      };

      // Parse agentId(s): blank => global; comma-separated => list
      const idsRaw = (agentId || '').trim();
      const hasAnyAgentIds = idsRaw.length > 0;
      let upsertedItems = [];

      if (!hasAnyAgentIds && !agent) {
        // Global promo
        const filter = { code: codes, isGlobal: true };
        const payload = { ...base, isGlobal: true, agent: undefined };
        const upserted = await PromoCode.findOneAndUpdate(filter, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
        upsertedItems.push(upserted);
      } else {
        // Specific agents
        const agentIds = [];
        if (agent) agentIds.push(agent);
        if (hasAnyAgentIds) {
          idsRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).forEach(v => agentIds.push(v));
        }

        // Resolve agent IDs (FD1234) to user ids
        const resolved = [];
        for (const idOrMongo of agentIds) {
          let user = null;
          if (/^FD\d{4}$/i.test(idOrMongo)) {
            user = await User.findOne({ agentId: idOrMongo.toUpperCase() });
          } else {
            user = await User.findById(idOrMongo);
          }
          if (!user || user.userType !== 'agent') {
            return ResponseHandler.notFound(res, `Agent not found: ${idOrMongo}`);
          }
          resolved.push(user._id);
        }
        for (const agentObjectId of resolved) {
          const filter = { code: codes, agent: agentObjectId };
          const payload = { ...base, isGlobal: false, agent: agentObjectId };
          const upserted = await PromoCode.findOneAndUpdate(filter, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
          upsertedItems.push(upserted);
        }
      }

      // Ensure createdBy populated on insert
      await Promise.all(upsertedItems.map(async u => {
        if (u && u.isNew) {
          u.createdBy = req.user._id;
          await u.save();
        }
      }));

      return ResponseHandler.success(res, { items: upsertedItems }, 'Promo saved');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to save promo');
    }
  }

  async listForAgent(req, res) {
    try {
      const agentId = req.params.agentId || req.user._id;
      const now = new Date();
      const items = await PromoCode.find({
        isActive: true,
        $and: [
          { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
          { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] }
        ],
        $or: [
          { isGlobal: true },
          { agent: agentId }
        ]
      }).sort({ createdAt: -1 });
      return ResponseHandler.success(res, { items });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to list promo codes');
    }
  }

  async listAllAdmin(req, res) {
    try {
      const { page = 1, limit = 50, q } = req.query;
      const filter = {};
      if (q) filter.code = new RegExp(q, 'i');
      const items = await PromoCode.find(filter)
        .populate({ path: 'agent', select: 'agentId companyName' })
        .populate({ path: 'createdBy', select: 'email' })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
      const total = await PromoCode.countDocuments(filter);
      return ResponseHandler.success(res, { items, page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) });
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to list all promo codes');
    }
  }

  async deletePromo(req, res) {
    try {
      const { id } = req.params;
      const deleted = await PromoCode.findByIdAndDelete(id);
      if (!deleted) return ResponseHandler.notFound(res, 'Promo not found');
      return ResponseHandler.success(res, null, 'Promo deleted');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to delete promo');
    }
  }

  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const promo = await PromoCode.findByIdAndUpdate(id, { isActive: Boolean(isActive), updatedBy: req.user._id }, { new: true });
      if (!promo) return ResponseHandler.notFound(res, 'Promo not found');
      return ResponseHandler.success(res, promo, 'Promo updated');
    } catch (error) {
      return ResponseHandler.error(res, error.message || 'Failed to update promo');
    }
  }
}

module.exports = new PromoController();


