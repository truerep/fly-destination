const mongoose = require('mongoose');

const financeRequestSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // type: increase total/available or settle balance due
  type: { type: String, enum: ['totalCreditLimit', 'availableCreditLimit', 'balanceDueSettlement'], required: true },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note: { type: String, trim: true },
  paymentScreenshotUrl: { type: String, trim: true },
  paymentReference: { type: String, trim: true },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

financeRequestSchema.index({ agent: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('FinanceRequest', financeRequestSchema);


