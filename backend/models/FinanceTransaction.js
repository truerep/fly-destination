const mongoose = require('mongoose');

const financeTransactionSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['totalCreditLimit', 'availableCreditLimit', 'balanceDue'], required: true },
  amount: { type: Number, required: true }, // positive for increase, negative for decrease
  valueBefore: { type: Number, required: true },
  valueAfter: { type: Number, required: true },
  action: { type: String, enum: ['adjust', 'request_approve', 'booking', 'refund', 'settlement_request', 'settlement_approve', 'settlement_reject'], required: true },
  referenceType: { type: String },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  note: { type: String, trim: true },
  source: { type: String, enum: ['admin', 'system', 'agent'], default: 'system' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Snapshots after this transaction
  availableAfter: { type: Number },
  totalAfter: { type: Number }
}, { timestamps: true });

financeTransactionSchema.index({ agent: 1, createdAt: -1 });

module.exports = mongoose.model('FinanceTransaction', financeTransactionSchema);



