const mongoose = require('mongoose');

const promoAssignmentSchema = new mongoose.Schema({
  // If isGlobal is true, applies to all agents; otherwise either specific agent
  isGlobal: { type: Boolean, default: false },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  code: { type: String, required: true, uppercase: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  isPercent: { type: Boolean, default: false },
  maxDiscount: { type: Number, min: 0 },
  startsAt: { type: Date },
  endsAt: { type: Date },
  usageLimit: { type: Number, min: 1 },
  usageCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Unique per agent where agent is set
promoAssignmentSchema.index(
  { code: 1, agent: 1 },
  { unique: true, partialFilterExpression: { agent: { $type: 'objectId' } } }
);
// Unique global code when isGlobal true
promoAssignmentSchema.index(
  { code: 1, isGlobal: 1 },
  { unique: true, partialFilterExpression: { isGlobal: true } }
);

module.exports = mongoose.model('PromoCode', promoAssignmentSchema);


